import { render } from '@testing-library/react';
import App from './App';

test('renders amp-app div', () => {
  const { container } = render(<App />);
  const mainElement = container.getElementsByClassName('amp-app');
  expect(mainElement).toBeDefined();
});
