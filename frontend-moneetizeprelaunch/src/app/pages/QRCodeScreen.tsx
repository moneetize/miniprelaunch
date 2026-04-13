import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { X, Download, Share2, ChevronLeft } from 'lucide-react';
import QRCode from 'react-qr-code';

export function QRCodeScreen() {
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Get user info from localStorage
  const userName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('user_email') || '';
  const userId = localStorage.getItem('user_id') || userEmail || 'user123';
  
  // Get avatar from multiple possible sources
  const userPhoto = sessionStorage.getItem('userPhoto') || localStorage.getItem('userPhoto') || localStorage.getItem('selectedAvatar') || '';
  const userAvatar = userPhoto;
  
  // Get bio from interests/profile
  const interests = localStorage.getItem('selectedInterests');
  const investmentProfile = localStorage.getItem('investmentProfile') || '';
  
  // Create a descriptive bio
  let userBio = 'Revenue Generator | Strategic Communicator | Social Media Connector | Content Marketer';
  if (interests) {
    try {
      const parsedInterests = JSON.parse(interests);
      if (parsedInterests.length > 0) {
        userBio = parsedInterests.slice(0, 3).join(' • ');
        if (investmentProfile) {
          userBio += ` | ${investmentProfile}`;
        }
      }
    } catch (e) {
      console.error('Error parsing interests:', e);
    }
  }

  // Generate unique profile URL for connection requests
  const connectionUrl = `${window.location.origin}/connection-request?userId=${encodeURIComponent(userId)}`;
  const profileUrl = connectionUrl;

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      // Create a canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (larger for better quality)
      canvas.width = 1200;
      canvas.height = 1600;

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw user avatar if available
      if (userAvatar) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Draw avatar circle
          const avatarSize = 200;
          const avatarX = canvas.width / 2;
          const avatarY = 150;

          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
          ctx.restore();

          // Add border
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(avatarX, avatarY, avatarSize / 2 + 3, 0, Math.PI * 2);
          ctx.stroke();

          continueDrawing();
        };
        img.src = userAvatar;
      } else {
        continueDrawing();
      }

      function continueDrawing() {
        // Draw user name
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(userName, canvas.width / 2, 300);

        // Draw bio (wrap text)
        ctx.font = '32px Arial';
        ctx.fillStyle = '#666666';
        const bioLines = wrapText(ctx, userBio, canvas.width - 100);
        bioLines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, 360 + index * 40);
        });

        // Convert SVG to image and draw QR code
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const qrImg = new Image();
        qrImg.onload = () => {
          const qrSize = 600;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 500;

          // Draw white background for QR code
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

          // Draw QR code
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // Draw bottom text
          ctx.font = '28px Arial';
          ctx.fillStyle = '#666666';
          ctx.fillText('Scan to connect on Moneetize', canvas.width / 2, qrY + qrSize + 80);

          URL.revokeObjectURL(url);

          // Download
          canvas.toBlob((blob) => {
            if (!blob) return;
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `moneetize-qr-${userName.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
          });
        };
        qrImg.src = url;
      }

      function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = context.measureText(testLine);
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        return lines.slice(0, 2); // Max 2 lines
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Connect with ${userName} on Moneetize`,
          text: `Scan my QR code to connect with me on Moneetize!`,
          url: profileUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-6 h-3 bg-white/80 rounded-sm" />
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-11 left-0 right-0 bg-[#0a0e1a]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">My QR Code</h1>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 pb-20 px-4 sm:px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-b from-[#1a1d2e] to-[#0f1318] rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/5"
        >
          {/* User Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">M</span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{userName}</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
              {userBio}
            </p>
          </div>

          {/* QR Code */}
          <div ref={qrRef} className="bg-white p-8 rounded-2xl shadow-inner mb-8 flex justify-center">
            <QRCode
              value={profileUrl}
              size={280}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox={`0 0 280 280`}
              fgColor="#3b82f6"
              bgColor="#ffffff"
            />
          </div>

          {/* Instructions */}
          <div className="text-center mb-8">
            <p className="text-white font-semibold mb-2">
              Scan to connect on Moneetize
            </p>
            <p className="text-gray-400 text-sm">
              Share this QR code with others to instantly connect and grow your network
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
            <button
              onClick={handleShare}
              className="w-full bg-white/10 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all border-2 border-white/20"
            >
              <Share2 className="w-5 h-5" />
              {copied ? 'Link Copied!' : 'Share Profile'}
            </button>
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20"
        >
          <h3 className="text-blue-400 font-semibold mb-3 text-lg">How to use your QR code:</h3>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold text-lg">1.</span>
              <span>Show your QR code to people you meet in person or at events</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold text-lg">2.</span>
              <span>They can scan it with their camera app to instantly view your profile</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold text-lg">3.</span>
              <span>Download and add it to business cards, email signatures, or presentations</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold text-lg">4.</span>
              <span>Share it on social media to grow your Moneetize network</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}