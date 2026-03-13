export const playNotificationSound = () => {
  // A short, pleasant "pop/bell" sound in base64 to avoid needing an external asset file
  // This is a minimal valid 8kHz mono WAV file containing a synthesized ping
  const soundData = "data:audio/wav;base64,UklGRqAIAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YYAIAAC9/8b/xv/K/9T/2v/k/+7/9v/+/wYADgAWABwAIgAoAC0AMgA0ADcANwA0ADAAKgAiABkADwAHAPv/8f/o/9//0v/F/7r/sf+q/6T/ov+h/6P/p/+t/7T/uf/A/8r/1f/c/+P/6//z//j///8EAAgADgATABgAHAAfACEAIwAkACQAJAAjACEAHwAcABgAEgANAAgAAwD+//n/9P/v/+r/5v/i/9//3f/c/9v/3P/e/+D/4//m/+v/8P/1//r///8DAAcACwAPABIAFQAYABoAHAAdAB8AHwAfAB4AHQAbABkAFgATAA8ACwAHAAIA/v/6//T/8f/u/+z/6//p/+j/5//m/+b/5v/n/+j/6f/r/+3/7//y//P/9v/5//v//v8BAAQABwAKAA0ADwARABMAFQAWABcAOAAnAAsA6P++/5j/a/9D/xX/5v+6/5z/dP9A/yD//v/T/6v/ff9Y/0P/Iv8I//H/yP+n/4r/bP9X/0L/Lf8h/xL/A/8A/wT/C//l/77/mv9w/0f/Fv/l/7z/nP9+/1z/Tv8z/zL//f/K/6r/j/9w/1z/Sf8x/yP/E/8O/+n/2v+z/4//af9h/0f/Mv8g/xb/CP8J/9r/tv+N/4T/bP9V/0T/Nv8q/xv/C/8N/+//0/++/6r/nf+U/4b/fP9u/2T/W/9L/0j/Kv8b/xn//f/A/6b/kv+B/13/Tf89/y7/Gf8EAAAAAA==";

  const audio = new Audio(soundData);
  audio.volume = 0.5;
  audio.play().catch(err => {
    // Browsers often block autoplay until user interacts, just log securely
    console.debug('Audio play blocked or failed:', err);
  });
};
