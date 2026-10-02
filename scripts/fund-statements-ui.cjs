// All APIs mocked. No production accounts, statements or payments are changed.
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE || '../.codex-build/ui-check/node_modules/playwright',
);
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  try {
    for (const role of ['Manager', 'Donor', 'CharityOrganization']) {
      const context = await browser.newContext({ viewport: { width: 1365, height: 950 } });
      const page = await context.newPage();
      const errors = [];
      let uploaded = role !== 'Manager',
        writes = 0,
        statusRequests = 0,
        downloads = 0,
        body = '';
      const row = {
        id: '11111111-1111-1111-1111-111111111111',
        month: '2026-09',
        closingBalance: 200000,
        note: 'Sao kê tháng đầu tiên',
        publishedBy: 'Manager',
        publishedAt: '2026-10-01T01:00:00Z',
      };
      page.on('pageerror', (e) => errors.push(e.message));
      await context.addInitScript((role) => {
        localStorage.setItem('accessToken', 'mock-token');
        localStorage.setItem(
          'user',
          JSON.stringify({ userId: 'test', role, fullName: 'Test User', userName: 'test' }),
        );
        localStorage.setItem('theme', 'light');
      }, role);
      await page.route('**/*', async (route) => {
        const request = route.request(),
          url = new URL(request.url());
        if (!url.pathname.includes('/api/'))
          return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
        const path = url.pathname.split('/api/')[1];
        let data = { items: [], total: 0, page: 1, pageSize: 20 };
        if (path === 'operating-fund/summary')
          data = {
            totalReceived: 0,
            totalSpent: 0,
            balance: 0,
            contributions: 0,
            paymentEnabled: false,
          };
        if (path === 'operating-fund/statements/status') {
          statusRequests++;
          data = {
            startMonth: '2026-09',
            latestClosedMonth: '2026-09',
            missingMonths: uploaded ? [] : ['2026-09'],
          };
        }
        if (path === 'operating-fund/statements') {
          if (request.method() === 'POST') {
            assert.equal(role, 'Manager');
            writes++;
            body = request.postData();
            uploaded = true;
            data = { id: row.id };
          } else
            data = { items: uploaded ? [row] : [], total: uploaded ? 1 : 0, page: 1, pageSize: 12 };
        }
        if (path.endsWith('/document')) {
          assert.equal(request.headers().authorization, 'Bearer mock-token');
          downloads++;
          return route.fulfill({
            status: 200,
            contentType: 'application/pdf',
            body: Buffer.from('%PDF-1.7\nTest statement\n%%EOF'),
          });
        }
        if (path === 'notifications') data = { items: [], unreadCount: 0 };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data),
        });
      });
      await page.goto(
        'http://127.0.0.1:5183' +
          (role === 'Manager'
            ? '/manager/fund#statements'
            : role === 'Donor'
              ? '/fund'
              : '/organization/fund'),
      );
      const section = page.locator('#statements');
      await section.getByRole('heading', { name: 'Sao kê ngân hàng hàng tháng' }).waitFor();
      if (role === 'Manager') {
        await section.getByText('Cần đăng sao kê 1 tháng', { exact: true }).waitFor();
        assert.equal(
          await section.getByLabel('Tháng sao kê', { exact: true }).inputValue(),
          '2026-09',
        );
        await section.getByLabel('Số dư cuối tháng (VND)', { exact: true }).fill('200000');
        assert.equal(
          await section.getByLabel('Số dư cuối tháng (VND)', { exact: true }).inputValue(),
          '200.000',
        );
        await section
          .getByLabel('File sao kê PDF')
          .setInputFiles({
            name: 'statement.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.7\nTest statement\n%%EOF'),
          });
        await section.getByLabel('Ghi chú sao kê').fill(row.note);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(300);
        assert.equal(await section.evaluate((el) => el.scrollWidth > el.clientWidth + 1), false);
        await section.screenshot({ path: '.codex-build/statements-Manager-form-mobile.png' });
        await page.setViewportSize({ width: 1365, height: 950 });
        await section.getByRole('button', { name: 'Xem lại và đăng sao kê', exact: true }).click();
        assert.equal(writes, 0);
        await page
          .getByRole('dialog', { name: 'Xác nhận đăng sao kê' })
          .getByRole('button', { name: 'Xác nhận đăng sao kê', exact: true })
          .click();
        await section.getByText('Đã công bố sao kê tháng 09/2026.', { exact: true }).waitFor();
        await section.getByText('Đã đủ sao kê các tháng đến hạn.', { exact: false }).waitFor();
        assert.equal(writes, 1);
        assert.match(body, /name="closingBalance"\r\n\r\n200000\r\n/);
        assert.match(body, /name="month"\r\n\r\n2026-09\r\n/);
        assert.equal(
          await section
            .getByRole('button', { name: 'Xem lại và đăng sao kê', exact: true })
            .count(),
          0,
        );
      } else {
        await section.getByRole('heading', { name: 'Sao kê tháng 09/2026' }).waitFor();
        assert.equal(statusRequests, 0);
        assert.equal(await section.locator('form').count(), 0);
      }
      const download = page.waitForEvent('download');
      await section.getByRole('button', { name: 'Tải sao kê tháng 09/2026', exact: true }).click();
      assert.equal((await download).suggestedFilename(), 'sao-ke-2026-09.pdf');
      assert.equal(downloads, 1);
      await section.screenshot({ path: `.codex-build/statements-${role}-desktop.png` });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      assert.equal(await section.evaluate((el) => el.scrollWidth > el.clientWidth + 1), false);
      await section.screenshot({ path: `.codex-build/statements-${role}-mobile.png` });
      assert.deepEqual(errors, []);
      console.log(
        'PASS statement UI:',
        role,
        'publication confirmation, private download, responsive layout',
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
