import { getEnabledManagedSkills } from './managedSkillsConfig.js';
import {
  secFilingSkill,
  epaComplianceSkill,
  fdaSafetySkill,
  caseLawSkill,
  legislationSkill,
  patentSkill,
  ptabSkill,
  federalRegisterSkill,
  productSafetySkill,
  antitrustSkill,
  stateCourtSkill,
  stateStatuteSkill
} from './customSkills/index.js';

// Central registry for skills with enable/disable toggles
const CUSTOM_SKILLS = {
  sec_filing_extractor: { enabled: true, skill: secFilingSkill },
  epa_compliance_analyzer: { enabled: true, skill: epaComplianceSkill },
  fda_safety_analyzer: { enabled: true, skill: fdaSafetySkill },
  case_law_extractor: { enabled: true, skill: caseLawSkill },
  legislation_analyzer: { enabled: true, skill: legislationSkill },
  patent_analyzer: { enabled: true, skill: patentSkill },
  ptab_analyzer: { enabled: true, skill: ptabSkill },
  federal_register_analyzer: { enabled: true, skill: federalRegisterSkill },
  product_safety_analyzer: { enabled: true, skill: productSafetySkill },
  antitrust_analyzer: { enabled: true, skill: antitrustSkill },
  state_court_analyzer: { enabled: true, skill: stateCourtSkill },
  state_statute_analyzer: { enabled: true, skill: stateStatuteSkill }
};

export function getCustomSkills(enabledOnly = true) {
  return Object.entries(CUSTOM_SKILLS)
    .filter(([, cfg]) => (enabledOnly ? cfg.enabled : true))
    .map(([, cfg]) => cfg.skill);
}

export function getManagedSkills() {
  return getEnabledManagedSkills().map((id) => ({ id }));
}

export function setSkillEnabled(name, enabled) {
  if (CUSTOM_SKILLS[name]) {
    CUSTOM_SKILLS[name].enabled = enabled;
  }
}

export function listSkillNames() {
  return Object.keys(CUSTOM_SKILLS);
}

