import { describe, test, expect } from '@jest/globals';
import { MANAGED_SKILLS, getEnabledManagedSkills } from '../../src/skills/managedSkillsConfig.js';
import { buildSkillsContainer } from '../../src/utils/skillsRequestBuilder.js';

describe('Managed Skills Configuration', () => {
  test('should expose pdf/xlsx/docx as enabled by default', () => {
    const enabled = getEnabledManagedSkills();
    expect(enabled).toEqual(expect.arrayContaining(['pdf', 'xlsx', 'docx']));
    expect(enabled).not.toContain('pptx'); // default disabled
  });

  test('should build container.skills entries for enabled skills', () => {
    const container = buildSkillsContainer();
    expect(container).toEqual(
      expect.arrayContaining([
        { type: 'anthropic', skill_id: 'pdf' },
        { type: 'anthropic', skill_id: 'xlsx' },
        { type: 'anthropic', skill_id: 'docx' }
      ])
    );
  });

  test('should omit container when no skills are enabled', () => {
    const original = { ...MANAGED_SKILLS };
    // Disable all temporarily
    Object.keys(MANAGED_SKILLS).forEach((key) => {
      MANAGED_SKILLS[key].enabled = false;
    });

    const container = buildSkillsContainer();
    expect(container).toBeNull();

    // Restore defaults
    Object.entries(original).forEach(([key, value]) => {
      MANAGED_SKILLS[key].enabled = value.enabled;
    });
  });
});

