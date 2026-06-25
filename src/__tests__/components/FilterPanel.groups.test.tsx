import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel, FilterGroupConfig } from '../../components/FilterPanel';
import { FilterProvider } from '../../contexts/FilterContext';
import { TagGroupFilter } from '../../components/recipe/TagGroupFilter';
import { DifficultyFilter } from '../../components/recipe/DifficultyFilter';
import { MaxTimeFilter } from '../../components/recipe/MaxTimeFilter';
import { useFilter } from '../../hooks/useFilter';
import { TAG_GROUPS } from '../../lib/constants';

function buildGroups(): FilterGroupConfig[] {
  return [
    {
      id: 'phase',
      title: 'Zyklusphase',
      emphasized: true,
      content: <div data-testid="phase-content">Phase</div>,
    },
    { id: 'ingredients', title: 'Zutaten', content: <div data-testid="ingredient-content" /> },
    {
      id: 'ernaehrung',
      title: 'Ernährung',
      content: <TagGroupFilter tags={TAG_GROUPS.ernaehrung} />,
    },
    {
      id: 'hauptzutat',
      title: 'Hauptzutat',
      content: <TagGroupFilter tags={TAG_GROUPS.hauptzutat} />,
    },
    {
      id: 'ernaehrungsform',
      title: 'Ernährungsform',
      content: <TagGroupFilter tags={TAG_GROUPS.ernaehrungsform} />,
    },
    { id: 'backen', title: 'Backen', content: <TagGroupFilter tags={TAG_GROUPS.backen} /> },
    { id: 'anlaesse', title: 'Anlässe', content: <TagGroupFilter tags={TAG_GROUPS.anlaesse} /> },
    { id: 'aufwand', title: 'Aufwand', content: <DifficultyFilter /> },
    { id: 'max-time', title: 'Zubereitungszeit', content: <MaxTimeFilter /> },
  ];
}

function ActiveFiltersProbe() {
  const { selectedTags, difficulty, maxTime } = useFilter();
  return (
    <div data-testid="active-filters">{JSON.stringify({ selectedTags, difficulty, maxTime })}</div>
  );
}

function PanelWithContext() {
  const { selectedTags, difficulty, maxTime, clearFilters } = useFilter();
  const hasActiveFilters = selectedTags.length > 0 || difficulty !== null || maxTime !== null;

  return (
    <>
      <ActiveFiltersProbe />
      <FilterPanel
        groups={buildGroups()}
        onReset={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </>
  );
}

function renderPanel() {
  return render(
    <FilterProvider>
      <PanelWithContext />
    </FilterProvider>
  );
}

describe('FilterPanel — REWE metadata groups (REQ-017)', () => {
  // TC-017-07 — AC-017-06
  it('renders Ernährung/Hauptzutat/Ernährungsform/Backen/Anlässe, Aufwand, max-time', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'Ernährung' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hauptzutat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ernährungsform' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Backen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anlässe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aufwand' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zubereitungszeit' })).toBeInTheDocument();
  });

  // TC-017-07 — AC-017-07
  it('keeps the cycle-phase group first', () => {
    renderPanel();

    const phaseHeading = screen.getByRole('button', { name: 'Zyklusphase' });
    const ernaehrungHeading = screen.getByRole('button', { name: 'Ernährung' });

    expect(
      phaseHeading.compareDocumentPosition(ernaehrungHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // TC-017-08 — AC-017-08
  it('updates active filters on selection', () => {
    renderPanel();

    fireEvent.click(screen.getByLabelText('Vegan'));

    expect(screen.getByTestId('active-filters').textContent).toContain('Vegan');
  });

  // TC-017-08 — AC-017-08
  it('reset clears the new groups too', () => {
    renderPanel();

    fireEvent.click(screen.getByLabelText('Vegan'));
    expect(screen.getByTestId('active-filters').textContent).toContain('"Vegan"');

    fireEvent.click(screen.getByRole('button', { name: /filter zurücksetzen/i }));

    expect(screen.getByTestId('active-filters').textContent).not.toContain('"Vegan"');
    expect(screen.getByTestId('active-filters').textContent).toContain('"selectedTags":[]');
  });
});
