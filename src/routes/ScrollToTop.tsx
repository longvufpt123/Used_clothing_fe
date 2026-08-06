import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Keeps every route transition at the beginning of its page. */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Manager/Admin layouts use their own scrollable content element.
    document
      .querySelectorAll<HTMLElement>('.admin-content-area, [data-route-scroll-container]')
      .forEach((element) => element.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }, [pathname]);

  return null;
};

export default ScrollToTop;
