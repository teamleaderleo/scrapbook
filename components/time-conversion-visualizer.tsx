'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function UTCTimeVisualizer() {
  const [localTime, setLocalTime] = useState(0);
  const [userTimezone, setUserTimezone] = useState('');
  const [utcOffset, setUtcOffset] = useState('');
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const sliderRef = useRef<HTMLInputElement>(null);
  const gradientPosRef = useRef({ value: 0 });

  useEffect(() => {
    setMounted(true);
    
    // Load anime.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js';
    script.async = true;
    document.head.appendChild(script);

    // Detect user's timezone and set current time
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    setLocalTime(minutesSinceMidnight);
    setCurrentTime(minutesSinceMidnight);
    setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Calculate UTC offset
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const offsetStr = offsetMins === 0 
      ? `UTC${sign}${offsetHours}` 
      : `UTC${sign}${offsetHours}:${String(offsetMins).padStart(2, '0')}`;
    setUtcOffset(offsetStr);

    // Set initial gradient position
    const initialPos = (minutesSinceMidnight / 1439) * 100;
    gradientPosRef.current.value = initialPos;
    if (sliderRef.current) {
      sliderRef.current.style.backgroundPosition = `${initialPos}% 50%`;
    }

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const calculateUTC = () => {
    const now = new Date();
    const localHours = Math.floor(localTime / 60);
    const localMinutes = localTime % 60;
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), localHours, localMinutes);
    const utcHours = localDate.getUTCHours();
    const utcMinutes = localDate.getUTCMinutes();
    return { hours: utcHours, minutes: utcMinutes };
  };

  const utcTime = calculateUTC();
  const localHours = Math.floor(localTime / 60);
  const localMinutes = localTime % 60;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setLocalTime(newTime);

    const targetPos = (newTime / 1439) * 100;
    if ((window as any).anime && sliderRef.current) {
      (window as any).anime({
        targets: gradientPosRef.current,
        value: targetPos,
        duration: 300,
        easing: 'easeOutCubic',
        update: () => {
          if (sliderRef.current) {
            sliderRef.current.style.backgroundPosition = `${gradientPosRef.current.value}% 50%`;
          }
        }
      });
    }
  };

  const handleSliderHover = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = Math.round(percentage * 1439);
    setLocalTime(newTime);

    const targetPos = (newTime / 1439) * 100;
    if ((window as any).anime && sliderRef.current) {
      (window as any).anime({
        targets: gradientPosRef.current,
        value: targetPos,
        duration: 150,
        easing: 'easeOutQuad',
        update: () => {
          if (sliderRef.current) {
            sliderRef.current.style.backgroundPosition = `${gradientPosRef.current.value}% 50%`;
          }
        }
      });
    }
  };

  const handleWrapperHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - sliderRect.left;
    const percentage = x / sliderRect.width;
    const cappedPercentage = Math.max(0, Math.min(1, percentage));
    const newTime = Math.round(cappedPercentage * 1439);
    setLocalTime(newTime);

    const targetPos = (newTime / 1439) * 100;
    if ((window as any).anime && sliderRef.current) {
      (window as any).anime({
        targets: gradientPosRef.current,
        value: targetPos,
        duration: 150,
        easing: 'easeOutQuad',
        update: () => {
          if (sliderRef.current) {
            sliderRef.current.style.backgroundPosition = `${gradientPosRef.current.value}% 50%`;
          }
        }
      });
    }
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const formatTime12Hour = (hours: number, minutes: number) => {
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const jumpToCurrentTime = () => {
    setLocalTime(currentTime);
    const targetPos = (currentTime / 1439) * 100;
    if ((window as any).anime && sliderRef.current) {
      (window as any).anime({
        targets: gradientPosRef.current,
        value: targetPos,
        duration: 500,
        easing: 'easeOutCubic',
        update: () => {
          if (sliderRef.current) {
            sliderRef.current.style.backgroundPosition = `${gradientPosRef.current.value}% 50%`;
          }
        }
      });
    }
  };

  const getTimeOfDay = () => {
    if (localHours < 6) return 'Night';
    if (localHours < 12) return 'Morning';
    if (localHours < 17) return 'Afternoon';
    if (localHours < 21) return 'Evening';
    return 'Night';
  };

  // Prevent hydration mismatch by not rendering time-dependent content until mounted
  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl px-4">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Time Zone Converter</h1>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <style jsx>{`
        .slider-daynight {
          background: linear-gradient(90deg,
            #1a1a3e 0%,
            #1f1f4a 4.17%,
            #2a2555 8.33%,
            #3d2d66 12.5%,
            #553a78 16.67%,
            #6d4a82 20.83%,
            #855e88 25%,
            #a07384 29.17%,
            #b8877d 33.33%,
            #d09d76 37.5%,
            #e8b56f 41.67%,
            #f5c961 45.83%,
            #ffd966 50%,
            #f5c961 54.17%,
            #e8b56f 58.33%,
            #d09d76 62.5%,
            #b8877d 66.67%,
            #a07384 70.83%,
            #855e88 75%,
            #6d4a82 79.17%,
            #553a78 83.33%,
            #3d2d66 87.5%,
            #2a2555 91.67%,
            #1f1f4a 95.83%,
            #1a1a3e 100%
          );
          background-size: 200% 100%;
          background-position: 0% 50%;
        }
        .slider-daynight::-webkit-slider-thumb {
          appearance: none;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4);
          transition: width 0.3s ease, height 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
        }
        .slider-daynight:hover::-webkit-slider-thumb {
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5);
        }
        .slider-daynight::-moz-range-thumb {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4);
          transition: width 0.3s ease, height 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
        }
        .slider-daynight:hover::-moz-range-thumb {
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5);
        }
      `}</style>
      
      <div className="w-full max-w-2xl px-4">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="mb-2">
              <h1 className="text-3xl font-bold inline">Current time: </h1>
              <button
                onClick={jumpToCurrentTime}
                className="text-3xl font-bold rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer align-baseline px-1.5"
              >
                {formatTime(Math.floor(currentTime / 60), currentTime % 60)}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{userTimezone} ({utcOffset})</p>
          </div>

          {/* Slider */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">
                Local Time
              </label>
              <div 
                className="relative" 
                style={{ paddingLeft: '4px', paddingRight: '4px', marginLeft: '-4px', marginRight: '-4px' }}
                onMouseMove={handleWrapperHover}
              >
                <input
                  ref={sliderRef}
                  type="range"
                  min="0"
                  max="1439"
                  step="1"
                  value={localTime}
                  onChange={handleSliderChange}
                  onMouseMove={handleSliderHover}
                  className="w-full h-16 rounded-full appearance-none cursor-pointer slider-daynight"
                />
              </div>
              <div className="flex justify-between text-muted-foreground text-xs mt-2">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Time display */}
            <div>
              <div className="flex items-baseline gap-3">
                <div className="text-6xl font-bold tracking-tight min-w-[11rem]">
                  {formatTime(localHours, localMinutes)}
                </div>
                <div className="text-4xl font-medium text-muted-foreground min-w-[1rem]">
                  {formatTime12Hour(localHours, localMinutes)}
                </div>
              </div>
              <div className="text-lg text-muted-foreground mt-1">
                {getTimeOfDay()}
              </div>
            </div>
          </div>

          {/* UTC Display */}
          <div className="flex gap-6 items-start">
            <div className="min-w-[10.34rem]">
              <p className="text-sm text-muted-foreground mb-2">UTC</p>
              <p className="text-4xl font-bold">
                {formatTime(utcTime.hours, utcTime.minutes)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Coordinated Universal Time
              </p>
            </div>
            
            <div className="flex gap-2">
              <div className="min-w-[7.8rem]">
                <p className="text-sm text-muted-foreground mb-2">UTC-5</p>
                <p className="text-4xl font-bold">
                  {formatTime((utcTime.hours - 5 + 24) % 24, utcTime.minutes)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Eastern Time
                </p>
              </div>

              <div className="min-w-[7.8rem]">
                <p className="text-sm text-muted-foreground mb-2">UTC-8</p>
                <p className="text-4xl font-bold">
                  {formatTime((utcTime.hours - 8 + 24) % 24, utcTime.minutes)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pacific Time
                </p>
              </div>

              <div className="min-w-[7.7rem]">
                <p className="text-sm text-muted-foreground mb-2">UTC+1</p>
                <p className="text-4xl font-bold">
                  {formatTime((utcTime.hours + 1) % 24, utcTime.minutes)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Central European
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}