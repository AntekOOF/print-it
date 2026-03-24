function QuantitySelector({ value, onChange, min = 1, max = 999 }) {
  const handleDecrease = () => onChange(Math.max(min, value - 1));
  const handleIncrease = () => onChange(Math.min(max, value + 1));

  return (
    <div className="quantity-selector">
      <button aria-label="Decrease quantity" type="button" onClick={handleDecrease}>
        -
      </button>
      <span>{value}</span>
      <button aria-label="Increase quantity" type="button" onClick={handleIncrease}>
        +
      </button>
    </div>
  );
}

export default QuantitySelector;
