import React from 'react'

interface JoinMeetingLoadProps {
  text?: string;
}

export default function JoinMeetingLoad({ text = 'POLYGLOT' }: JoinMeetingLoadProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white min-h-screen">
      <h1 
        className="text-4xl font-bold tracking-wider"
        style={{
          background: 'linear-gradient(-45deg, #FF6B6B, #FF458B, #9B6DFF, #4169E1)',
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'gradient 5s ease infinite',
        }}
      >
        {text}
      </h1>
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  )
}