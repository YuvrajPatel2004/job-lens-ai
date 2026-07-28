const Card = ({ children, className = '', hover = false, glow = false, ...props }) => {
  return (
    <div
      className={`rounded-2xl border border-white/6 p-5 transition-all duration-300 ${
        hover ? 'glass-hover cursor-pointer hover:scale-[1.01]' : ''
      } ${glow ? 'glow-primary' : ''} ${className}`}
      style={{ background: 'rgba(255, 255, 255, 0.03)' }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
