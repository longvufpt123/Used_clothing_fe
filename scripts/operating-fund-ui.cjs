// Run against local Vite with Playwright installed in the existing UI tools directory.
const {chromium}=require('../.codex-build/ui-check/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
 for(const role of ['Donor','CharityOrganization','Manager']) {
  const context=await browser.newContext({viewport:{width:1365,height:950}});const page=await context.newPage();let posts=[];const bodies=[];const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(role=>{localStorage.setItem('accessToken','mock-test');localStorage.setItem('user',JSON.stringify({userId:'test',role,fullName:'Test User',userName:'test'}));localStorage.setItem('theme','light');},role);
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.pathname.includes('/api/')){
    const path=url.pathname.split('/api/')[1];let data=[];
    if(path==='operating-fund/summary')data={totalReceived:100000,totalSpent:10000,balance:90000,contributions:2,paymentEnabled:true};
    else if(path==='operating-fund/expenses'&&route.request().method()==='GET')data={items:[{id:'expense',amount:10000,title:'Vận chuyển quần áo',description:'Chi phí xe giao đồ đến tổ chức từ thiện.',spentOn:'2026-09-22',publishedAt:'2026-09-22T10:00:00Z',publishedBy:'Manager'}],total:1,page:1,pageSize:20};
    else if(['operating-fund/mine','operating-fund/contributions'].includes(path))data={items:[],total:0,page:1,pageSize:20};
    else if(path==='operating-fund/checkout'){posts.push(path);bodies.push(route.request().postDataJSON());data={id:'test',status:'Paid'};}
    else if(path==='operating-fund/expenses'){posts.push(path);bodies.push(route.request().postData());data={id:'new'};}
    else if(path.includes('unread'))data={unreadCount:0};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});return;
   }
   if(url.hostname==='127.0.0.1'||url.hostname==='localhost')return route.continue();return route.abort();
  });
  const path=role==='Manager'?'/manager/fund':role==='Donor'?'/fund':'/organization/fund';await page.goto('http://127.0.0.1:5183'+path);
  await page.getByRole('heading',{name:'Quỹ vận hành minh bạch'}).waitFor();await page.getByRole('heading',{name:'Vận chuyển quần áo'}).waitFor();
  const amountInput=page.getByLabel('Số tiền (VND)',{exact:true});
  await amountInput.fill('200000');assert.equal(await amountInput.inputValue(),'200.000');
  assert.equal(await amountInput.evaluate(el=>el.checkValidity()),role!=='Manager');
  await amountInput.fill('');assert.equal(await amountInput.evaluate(el=>el.checkValidity()),false);
  await amountInput.fill('500000001');assert.equal(await amountInput.inputValue(),'500.000.001');assert.equal(await amountInput.evaluate(el=>el.checkValidity()),false);
  await amountInput.fill('200.000');assert.equal(await amountInput.inputValue(),'200.000');
  if(role==='Manager'){
   await page.getByLabel('Nội dung chi',{exact:true}).fill('Chi phí vận chuyển');await page.getByLabel('Số tiền (VND)',{exact:true}).fill('10000');await page.getByLabel('Mục đích / diễn giải').fill('Giao quần áo tới tổ chức');await page.getByLabel('Chứng từ JPG').setInputFiles({name:'proof.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nTest proof\n%%EOF')});
   await page.getByRole('button',{name:'Xem lại và công bố'}).click();assert.equal(posts.length,0);await page.getByRole('dialog').getByRole('button',{name:'Xác nhận',exact:true}).click();await page.getByText('Đã công bố khoản chi và chứng từ.').waitFor();assert.equal(posts.length,1);
   assert.match(bodies[0],/name="amount"\r\n\r\n10000\r\n/);
  }else{
   await page.getByRole('button',{name:'Đóng góp qua PayOS',exact:true}).click();assert.equal(posts.length,0);await page.getByRole('dialog').getByRole('button',{name:'Xác nhận',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(posts.length,1);
   assert.equal(bodies[0].amount,200000);
  }
  await page.screenshot({path:`.codex-build/fund-${role}-desktop.png`,fullPage:true});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await page.screenshot({path:`.codex-build/fund-${role}-mobile.png`,fullPage:true});
  const overflow=await page.locator('.fund-page').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(overflow,false,role+' overflow');assert.deepEqual(errors,[],role+' runtime errors');console.log('PASS',role,'confirmation, responsive layout, no runtime errors');await context.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
