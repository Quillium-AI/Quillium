import React from 'react';
import './Button.css';

/**
 * Button component for the Quillium UI
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, secondary, text)
 * @param {string} props.size - Button size (small, medium, large)
 * @param {boolean} props.fullWidth - Whether the button should take full width
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @returns {JSX.Element} - Button component
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  onClick,
  children,
  ...rest
}) => {
  const classes = [
    'quillium-button',
    `quillium-button--${variant}`,
    `quillium-button--${size}`,
    fullWidth ? 'quillium-button--full-width' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
