import { useScroll } from '@react-three/drei';
import { useEffect } from 'react';

export const DragPreventer = () => {
  const scroll = useScroll();

  useEffect(() => {
    if (!scroll.el) return;

    const scrollElement = scroll.el;
    let isDraggingScrollbar = false;

    const onPointerDown = (e: PointerEvent) => {
      const rect: DOMRect = scrollElement.getBoundingClientRect();
      const isNearScrollbar: boolean = e.clientX > rect.right - 20;

      if (isNearScrollbar) {
        isDraggingScrollbar = true;

        const onPointerUp = (): void => {
          isDraggingScrollbar = false;
          document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointerup', onPointerUp);
      }
    };

    const onScroll = () => {
      if (!isDraggingScrollbar) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const maxScroll = scrollHeight - clientHeight;

      if (scrollTop === 0) {
        scrollElement.scrollTop = 1;
      } else if (scrollTop >= maxScroll) {
        scrollElement.scrollTop = maxScroll - 1;
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    scrollElement.addEventListener('scroll', onScroll);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      scrollElement.removeEventListener('scroll', onScroll);
    };
  }, [scroll]);

  return null;
};
