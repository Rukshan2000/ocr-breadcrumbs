import { useEffect, useRef, useState, useCallback } from 'react';

interface AlignmentGuideProps {
  show: boolean;
}

export default function AlignmentGuide({ show }: AlignmentGuideProps) {
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [hasPermission, setHasPermission] = useState(false);
  const tiltBubbleRef = useRef<HTMLDivElement>(null);
  const flatBubbleRef = useRef<HTMLDivElement>(null);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const alpha = event.alpha || 0;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    setOrientation({ alpha, beta, gamma });
  }, []);

  useEffect(() => {
    const requestOrientationPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            setHasPermission(true);
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        } catch (error) {
          console.log('Orientation permission denied:', error);
        }
      } else {
        setHasPermission(true);
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    };

    requestOrientationPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  useEffect(() => {
    if (!show) return;

    const { beta, gamma } = orientation;

    // Update tilt bubble (left-right)
    const tiltOffset = Math.max(-40, Math.min(40, gamma * 1.5));
    if (tiltBubbleRef.current) {
      tiltBubbleRef.current.style.transform = `translateY(-50%) translateX(calc(-50% + ${tiltOffset}px))`;

      // Update color
      const tiltDeviation = Math.abs(gamma);
      tiltBubbleRef.current.classList.remove('alignment-good', 'alignment-warning', 'alignment-bad');
      if (tiltDeviation < 3) {
        tiltBubbleRef.current.classList.add('alignment-good');
      } else if (tiltDeviation < 10) {
        tiltBubbleRef.current.classList.add('alignment-warning');
      } else {
        tiltBubbleRef.current.classList.add('alignment-bad');
      }
    }

    // Update flat bubble (front-back)
    const targetBeta = 60;
    const betaDeviation = beta - targetBeta;
    const betaOffset = Math.max(-40, Math.min(40, betaDeviation * 0.8));
    if (flatBubbleRef.current) {
      flatBubbleRef.current.style.transform = `translateY(-50%) translateX(calc(-50% + ${betaOffset}px))`;

      // Update color
      flatBubbleRef.current.classList.remove('alignment-good', 'alignment-warning', 'alignment-bad');
      if (beta >= 30 && beta <= 90) {
        if (Math.abs(betaDeviation) < 15) {
          flatBubbleRef.current.classList.add('alignment-good');
        } else {
          flatBubbleRef.current.classList.add('alignment-warning');
        }
      } else if (beta >= 15 && beta <= 110) {
        flatBubbleRef.current.classList.add('alignment-warning');
      } else {
        flatBubbleRef.current.classList.add('alignment-bad');
      }
    }
  }, [orientation, show]);

  const getAlignmentStatus = () => {
    const { beta, gamma } = orientation;
    const tiltOk = Math.abs(gamma) < 5;
    const flatOk = beta >= 30 && beta <= 90;

    if (tiltOk && flatOk) {
      return { text: '✓ Perfect - Capture Now!', className: 'bg-green-500/80' };
    } else if (tiltOk || flatOk) {
      const issue = !tiltOk ? 'Level the phone' : 'Adjust angle';
      return { text: `⚠ ${issue}`, className: 'bg-yellow-500/80' };
    } else {
      return { text: '✗ Align camera', className: 'bg-red-500/80' };
    }
  };

  if (!show) return null;

  const status = getAlignmentStatus();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-40 border-2 border-white/50 rounded-lg">
          {/* Corner markers */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Level indicator (bubble level) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {/* Horizontal level */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">TILT</span>
          <div className="relative w-24 h-6 bg-black/50 rounded-full border border-white/30 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/50"></div>
            <div
              ref={tiltBubbleRef}
              className="level-bubble absolute top-1/2 left-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"
            ></div>
          </div>
        </div>

        {/* Front-back level */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">FLAT</span>
          <div className="relative w-24 h-6 bg-black/50 rounded-full border border-white/30 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/50"></div>
            <div
              ref={flatBubbleRef}
              className="level-bubble absolute top-1/2 left-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"
            ></div>
          </div>
        </div>
      </div>

      {/* Alignment status */}
      <div
        className={`absolute top-36 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white ${status.className}`}
      >
        {status.text}
      </div>

      {/* Angle readings */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-4 text-xs text-white/70 bg-black/40 px-3 py-1 rounded-full">
        <span>X: {orientation.beta.toFixed(1)}°</span>
        <span>Y: {orientation.gamma.toFixed(1)}°</span>
        <span>Z: {orientation.alpha.toFixed(1)}°</span>
      </div>
    </div>
  );
}
