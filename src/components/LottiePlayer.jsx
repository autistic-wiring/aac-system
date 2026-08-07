import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

const LottiePlayer = ({ src, animating, className }) => {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    // Load SVG vector animation via lottie-web
    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: src,
    });

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [src]);

  useEffect(() => {
    if (!animRef.current) return;
    if (animating) {
      animRef.current.goToAndPlay(0);
    } else {
      animRef.current.goToAndStop(0);
    }
  }, [animating]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
};

export default LottiePlayer;
