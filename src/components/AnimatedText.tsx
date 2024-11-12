'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AnimatedTextProps {
  text: string;
  speed?: number;
  initialText?: string;
}

const AnimatedText = ({ text, speed = 30, initialText }: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState(initialText || '');
  const prevTextRef = useRef(initialText || '');
  const currentIndexRef = useRef(initialText ? initialText.length : 0);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (text === prevTextRef.current) return;

    const animate = () => {
      if (currentIndexRef.current < text.length) {
        setDisplayedText(text.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current += 1;
        animationTimeoutRef.current = setTimeout(animate, speed);
      }
    };

    if (text.startsWith(prevTextRef.current)) {
      currentIndexRef.current = prevTextRef.current.length;
    } else {
      currentIndexRef.current = 0;
    }

    animate();
    prevTextRef.current = text;

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export default AnimatedText;