import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../../components/Pagination';

describe('Pagination Component', () => {
  // TC-015-10 — AC-015-12
  // Given a result set spanning several pages
  // When pagination renders
  // Then numbered page links are shown with the current page marked active
  it('renders numbered page links with the current page active', () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={2} totalPages={3} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();

    const activePage = screen.getByRole('button', { name: '2' });
    expect(activePage).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('returns null when there is only one page', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={jest.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
