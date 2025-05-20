import { useScroll } from '@react-three/drei';
import { useRef, useEffect } from 'react';

export const WrapFixer = () => {
  const state = useScroll();
  const prevPos = useRef(0);
  const disableRef = useRef(false);

  useEffect(() => {
    const el = state.el;
    if (!el) return;

    const axis = state.horizontal ? 'scrollLeft' : 'scrollTop';
    const len = state.horizontal ? 'clientWidth' : 'clientHeight';
    const size = state.horizontal ? 'scrollWidth' : 'scrollHeight';

    const scrollRange = el[size] - el[len];
    const thresholdPx = Math.ceil(Math.max(12, scrollRange * 0.01));

    const wrap = (toTop: boolean) => {
      const damp = toTop ? 1 - state.offset : 1 + state.offset;
      el[axis] = toTop ? 1 : scrollRange - 1;
      state.offset = toTop ? -damp : damp;
      disableRef.current = true;
    };

    const onScroll = () => {
      const cur = el[axis];
      const delta = scrollRange - cur;
      const dir = cur - prevPos.current;
      prevPos.current = cur;

      if (disableRef.current) {
        if (cur > thresholdPx && delta > thresholdPx) {
          disableRef.current = false;
        }
        return;
      }

      if (dir < 0 && cur <= thresholdPx) {
        wrap(false);
      } else if (dir > 0 && delta <= thresholdPx) {
        wrap(true);
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [state]);

  return null;
};
