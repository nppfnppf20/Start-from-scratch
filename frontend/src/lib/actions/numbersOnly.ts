export function numbersOnly(node: HTMLInputElement) {
  function handleKeydown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(event.key)) return;
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return;

    const step = node.getAttribute('step');
    const allowDecimal = step && (step === '0.1' || step === '0.01' || step === 'any');
    if (allowDecimal && event.key === '.' && !node.value.includes('.')) return;

    const min = node.getAttribute('min');
    const allowNegative = min && parseFloat(min) < 0;
    if (allowNegative && event.key === '-' && node.value.length === 0) return;

    if (event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  }

  node.addEventListener('keydown', handleKeydown);
  return {
    destroy() {
      node.removeEventListener('keydown', handleKeydown);
    }
  };
}

