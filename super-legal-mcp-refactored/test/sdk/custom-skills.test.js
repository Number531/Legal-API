import { describe, expect, test } from '@jest/globals';
import { getCustomSkills, listSkillNames } from '../../src/skills/skillsRegistry.js';

describe('Custom Skills Registry', () => {
  test('should expose all 12 domain skills enabled by default', () => {
    const names = listSkillNames();
    expect(names.length).toBe(12);
    const skills = getCustomSkills();
    expect(skills.length).toBe(12);
  });
});

