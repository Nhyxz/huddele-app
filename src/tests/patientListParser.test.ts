import { describe, it, expect } from 'vitest';
import { parsePatientList, parseLos, categoriseLos, matchKey } from '../utils/patientListParser';

describe('parseLos', () => {
  it('reads HH:MM, hours/minutes, decimals and categories', () => {
    expect(parseLos('13:30')).toEqual({ hours: 13.5, category: '> 12h' });
    expect(parseLos('3h 20m')?.category).toBe('3 - 4h');
    expect(parseLos('45m')?.category).toBe('< 2h');
    expect(parseLos('2.5')?.category).toBe('2 - 3h');
    expect(parseLos('> 12h')?.category).toBe('> 12h');
    expect(parseLos('4 - 12h')?.category).toBe('4 - 12h');
    expect(parseLos('<2h')?.category).toBe('< 2h');
    expect(parseLos('Majors 3')).toBeNull();
  });

  it('categorises boundaries consistently', () => {
    expect(categoriseLos(1.99)).toBe('< 2h');
    expect(categoriseLos(2)).toBe('2 - 3h');
    expect(categoriseLos(4)).toBe('4 - 12h');
    expect(categoriseLos(12)).toBe('4 - 12h');
    expect(categoriseLos(12.01)).toBe('> 12h');
  });
});

describe('parsePatientList', () => {
  it('parses tab-separated rows copied from an HTML table and skips the header', () => {
    const text = 'LOS\tLocation\tInitials\n13:40\tResus 2\tJK\n6:15\tMajors 4\tLM\n';
    const result = parsePatientList(text);
    expect(result.headerLinesSkipped).toBe(1);
    expect(result.validRows).toHaveLength(2);
    expect(result.validRows[0]).toMatchObject({ initials: 'JK', location: 'Resus 2', losCategory: '> 12h' });
  });

  it('parses comma-separated and single-space rows', () => {
    const result = parsePatientList('2:05, SAU 1, QS\n4 - 12h Majors 3 AB\n0:45 Streaming TU');
    expect(result.validRows.map(r => r.initials)).toEqual(['QS', 'AB', 'TU']);
    expect(result.validRows[1].location).toBe('Majors 3');
    expect(result.validRows[1].losCategory).toBe('4 - 12h');
  });

  it('detects columns in a different order', () => {
    const result = parsePatientList('AB\tMajors 3\t5:00');
    expect(result.validRows[0]).toMatchObject({ initials: 'AB', location: 'Majors 3', losCategory: '4 - 12h' });
  });

  it('flags invalid lines and duplicates without dropping them silently', () => {
    const result = parsePatientList('13:00\tResus 1\tAB\nnonsense line\n14:00\tResus 1\tab');
    expect(result.rows).toHaveLength(3);
    expect(result.validRows).toHaveLength(1);
    expect(result.rows[1].error).toBeDefined();
    expect(result.rows[2].error).toContain('Duplicate');
  });

  it('builds case-insensitive match keys', () => {
    expect(matchKey('ab', 'Majors  3')).toBe(matchKey('AB', 'majors 3'));
  });
});
