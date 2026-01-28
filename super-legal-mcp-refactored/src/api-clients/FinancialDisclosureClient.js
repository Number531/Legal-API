/**
 * Financial Disclosure API Client
 * Handles all judicial financial disclosure related API calls
 */

import { makeApiRequest } from '../utils/apiHelpers.js';
import { validateLimit } from '../utils/validation.js';

export class FinancialDisclosureClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  async searchFinancialDisclosures(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      judge_name,
      year,
      report_type,
      has_investments,
      limit = 20
    } = args;

    const validatedLimit = validateLimit(limit, 100);
    const params = {
      limit: validatedLimit
    };

    // Build filters
    if (judge_name) {
      // Search for judge by name first
      const judgeResponse = await makeApiRequest('/people/', {
        name: judge_name,
        limit: 1
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      
      if (judgeResponse.results && judgeResponse.results.length > 0) {
        params.person = judgeResponse.results[0].id;
      } else {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: `No judge found with name: ${judge_name}`,
              count: 0,
              disclosures: []
            })
          }]
        };
      }
    }

    if (year) params.year = year;
    if (report_type) params.report_type = report_type;
    if (has_investments !== undefined) params.has_investments = has_investments;

    const response = await makeApiRequest('/financial-disclosures/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.count || response.results.length,
          disclosures: response.results.map(disclosure => ({
            id: disclosure.id,
            person_name: disclosure.person_name || disclosure.person,
            year: disclosure.year,
            report_type: disclosure.report_type,
            date_created: disclosure.date_created,
            date_modified: disclosure.date_modified,
            download_url: disclosure.download_url,
            has_investments: disclosure.has_investments,
            investments_count: disclosure.investments_count || 0,
            non_investment_income_count: disclosure.non_investment_income_count || 0,
            positions_count: disclosure.positions_count || 0,
            agreements_count: disclosure.agreements_count || 0,
            gifts_count: disclosure.gifts_count || 0
          }))
        })
      }]
    };
  }

  async getFinancialDisclosureDetails(args) {
    const { disclosure_id } = args;
    
    if (!disclosure_id) {
      throw new Error("Financial disclosure ID is required");
    }

    const disclosure = await makeApiRequest(`/financial-disclosures/${disclosure_id}/`, {}, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    // Get related data if available
    let investments = [];
    let gifts = [];
    let positions = [];
    let nonInvestmentIncome = [];
    let agreements = [];

    // Fetch investments if present
    if (disclosure.has_investments) {
      const investmentsResponse = await makeApiRequest('/investments/', {
        financial_disclosure: disclosure_id,
        limit: 100
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      investments = investmentsResponse.results || [];
    }

    // Fetch other related data
    const [
      giftsResponse, 
      positionsResponse, 
      incomeResponse, 
      agreementsResponse,
      spouseIncomeResponse,
      reimbursementsResponse,
      debtsResponse,
      disclosurePositionsResponse
    ] = await Promise.all([
      makeApiRequest('/gifts/', { financial_disclosure: disclosure_id, limit: 100 }, {
        apiType: 'courtlistener', rateLimiter: this.rateLimiter
      }),
      makeApiRequest('/positions/', { financial_disclosure: disclosure_id, limit: 100 }, {
        apiType: 'courtlistener', rateLimiter: this.rateLimiter
      }),
      makeApiRequest('/non-investment-incomes/', { financial_disclosure: disclosure_id, limit: 100 }, {
        apiType: 'courtlistener', rateLimiter: this.rateLimiter
      }),
      makeApiRequest('/agreements/', { financial_disclosure: disclosure_id, limit: 100 }, {
        apiType: 'courtlistener', rateLimiter: this.rateLimiter
      }),
      makeApiRequest('/spouse-incomes/', { financial_disclosure: disclosure_id, limit: 100 }, {
        apiType: 'courtlistener', rateLimiter: this.rateLimiter
      }),
      makeApiRequest('/reimbursements/', { financial_disclosure: disclosure_id, limit: 100 }, {
        apiType: 'courtlistener', rateLimiter: this.rateLimiter
      }),
      makeApiRequest('/debts/', { financial_disclosure: disclosure_id, limit: 100 }, {
        apiType: 'courtlistener', rateLimiter: this.rateLimiter
      }),
      makeApiRequest('/disclosure-positions/', { financial_disclosure: disclosure_id, limit: 100 }, {
        apiType: 'courtlistener', rateLimiter: this.rateLimiter
      })
    ]);

    gifts = giftsResponse.results || [];
    positions = positionsResponse.results || [];
    nonInvestmentIncome = incomeResponse.results || [];
    agreements = agreementsResponse.results || [];
    const spouseIncomes = spouseIncomeResponse.results || [];
    const reimbursements = reimbursementsResponse.results || [];
    const debts = debtsResponse.results || [];
    const disclosurePositions = disclosurePositionsResponse.results || [];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          disclosure: {
            id: disclosure.id,
            person_name: disclosure.person_name || disclosure.person,
            year: disclosure.year,
            report_type: disclosure.report_type,
            date_created: disclosure.date_created,
            date_modified: disclosure.date_modified,
            download_url: disclosure.download_url,
            addendum_url: disclosure.addendum_url,
            is_amended: disclosure.is_amended
          },
          investments: investments.map(inv => ({
            id: inv.id,
            description: inv.description,
            gross_value_code: inv.gross_value_code,
            gross_value_method: inv.gross_value_method,
            income_during_reporting_period_code: inv.income_during_reporting_period_code,
            income_during_reporting_period_type: inv.income_during_reporting_period_type,
            transaction_during_reporting_period: inv.transaction_during_reporting_period,
            transaction_date: inv.transaction_date,
            transaction_value_code: inv.transaction_value_code,
            transaction_gain_code: inv.transaction_gain_code
          })),
          gifts: gifts.map(gift => ({
            id: gift.id,
            source: gift.source,
            description: gift.description,
            value: gift.value,
            redacted: gift.redacted
          })),
          positions: positions.map(pos => ({
            id: pos.id,
            position: pos.position,
            name_of_organization: pos.name_of_organization,
            redacted: pos.redacted
          })),
          non_investment_income: nonInvestmentIncome.map(income => ({
            id: income.id,
            source_type: income.source_type,
            income_amount: income.income_amount,
            redacted: income.redacted
          })),
          agreements: agreements.map(agreement => ({
            id: agreement.id,
            parties_and_terms: agreement.parties_and_terms,
            redacted: agreement.redacted
          })),
          spouse_incomes: spouseIncomes.map(income => ({
            id: income.id,
            source_type: income.source_type,
            date_raw: income.date_raw,
            redacted: income.redacted
          })),
          reimbursements: reimbursements.map(reimb => ({
            id: reimb.id,
            source: reimb.source,
            date_raw: reimb.date_raw,
            location: reimb.location,
            purpose: reimb.purpose,
            items_paid_or_provided: reimb.items_paid_or_provided,
            redacted: reimb.redacted
          })),
          debts: debts.map(debt => ({
            id: debt.id,
            creditor_name: debt.creditor_name,
            description: debt.description,
            value_code: debt.value_code,
            redacted: debt.redacted
          })),
          disclosure_positions: disclosurePositions.map(pos => ({
            id: pos.id,
            position: pos.position,
            name_of_organization: pos.name_of_organization,
            redacted: pos.redacted
          }))
        })
      }]
    };
  }

  async searchJudgeInvestments(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      company_name,
      judge_name,
      investment_type,
      min_value,
      max_value,
      year,
      limit = 20
    } = args;

    const validatedLimit = validateLimit(limit, 100);
    const params = {
      limit: validatedLimit
    };

    if (company_name) params.description__icontains = company_name;
    if (investment_type) params.income_during_reporting_period_type = investment_type;
    
    // Value codes mapping (approximate)
    if (min_value) {
      if (min_value >= 50000001) params.gross_value_code__in = ["P4"];
      else if (min_value >= 5000001) params.gross_value_code__in = ["P3", "P4"];
      else if (min_value >= 1000001) params.gross_value_code__in = ["P2", "P3", "P4"];
      else if (min_value >= 250001) params.gross_value_code__in = ["P1", "P2", "P3", "P4"];
    }

    if (judge_name) {
      // Get judge ID first
      const judgeResponse = await makeApiRequest('/people/', {
        name: judge_name,
        limit: 1
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      
      if (judgeResponse.results && judgeResponse.results.length > 0) {
        // Get financial disclosures for this judge
        const disclosureResponse = await makeApiRequest('/financial-disclosures/', {
          person: judgeResponse.results[0].id,
          year: year,
          limit: 100
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        if (disclosureResponse.results && disclosureResponse.results.length > 0) {
          params.financial_disclosure__in = disclosureResponse.results.map(d => d.id).join(',');
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `No financial disclosures found for judge: ${judge_name}`,
                count: 0,
                investments: []
              })
            }]
          };
        }
      }
    }

    const response = await makeApiRequest('/investments/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.count || response.results.length,
          investments: response.results.map(inv => ({
            id: inv.id,
            description: inv.description,
            gross_value_code: inv.gross_value_code,
            gross_value_method: inv.gross_value_method,
            income_type: inv.income_during_reporting_period_type,
            income_code: inv.income_during_reporting_period_code,
            has_transaction: inv.transaction_during_reporting_period,
            transaction_date: inv.transaction_date,
            transaction_value_code: inv.transaction_value_code,
            transaction_gain_code: inv.transaction_gain_code,
            financial_disclosure_id: inv.financial_disclosure,
            redacted: inv.redacted
          }))
        })
      }]
    };
  }

  async getJudgeGifts(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      judge_name,
      min_value,
      year,
      limit = 20
    } = args;

    const validatedLimit = validateLimit(limit, 100);
    const params = {
      limit: validatedLimit
    };

    if (min_value) params.value__gte = min_value;

    if (judge_name) {
      // Get judge ID first
      const judgeResponse = await makeApiRequest('/people/', {
        name: judge_name,
        limit: 1
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      
      if (judgeResponse.results && judgeResponse.results.length > 0) {
        // Get financial disclosures for this judge
        const disclosureResponse = await makeApiRequest('/financial-disclosures/', {
          person: judgeResponse.results[0].id,
          year: year,
          limit: 100
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        if (disclosureResponse.results && disclosureResponse.results.length > 0) {
          params.financial_disclosure__in = disclosureResponse.results.map(d => d.id).join(',');
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `No financial disclosures found for judge: ${judge_name}`,
                count: 0,
                gifts: []
              })
            }]
          };
        }
      }
    }

    const response = await makeApiRequest('/gifts/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.count || response.results.length,
          gifts: response.results.map(gift => ({
            id: gift.id,
            source: gift.source,
            description: gift.description,
            value: gift.value,
            financial_disclosure_id: gift.financial_disclosure,
            redacted: gift.redacted
          }))
        })
      }]
    };
  }

  async getJudgePositions(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      judge_name,
      organization,
      position_type,
      year,
      limit = 20
    } = args;

    const validatedLimit = validateLimit(limit, 100);
    const params = {
      limit: validatedLimit
    };

    if (organization) params.name_of_organization__icontains = organization;
    if (position_type) params.position__icontains = position_type;

    if (judge_name) {
      // Get judge ID first
      const judgeResponse = await makeApiRequest('/people/', {
        name: judge_name,
        limit: 1
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      
      if (judgeResponse.results && judgeResponse.results.length > 0) {
        // Get financial disclosures for this judge
        const disclosureResponse = await makeApiRequest('/financial-disclosures/', {
          person: judgeResponse.results[0].id,
          year: year,
          limit: 100
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        if (disclosureResponse.results && disclosureResponse.results.length > 0) {
          params.financial_disclosure__in = disclosureResponse.results.map(d => d.id).join(',');
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `No financial disclosures found for judge: ${judge_name}`,
                count: 0,
                positions: []
              })
            }]
          };
        }
      }
    }

    const response = await makeApiRequest('/positions/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.count || response.results.length,
          positions: response.results.map(pos => ({
            id: pos.id,
            position: pos.position,
            name_of_organization: pos.name_of_organization,
            financial_disclosure_id: pos.financial_disclosure,
            redacted: pos.redacted
          }))
        })
      }]
    };
  }

  async searchJudgeSpouseIncome(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      judge_name,
      source_type,
      year,
      limit = 20
    } = args;

    const validatedLimit = validateLimit(limit, 100);
    const params = {
      limit: validatedLimit
    };

    if (source_type) params.source_type__icontains = source_type;

    if (judge_name) {
      // Get judge ID first
      const judgeResponse = await makeApiRequest('/people/', {
        name: judge_name,
        limit: 1
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      
      if (judgeResponse.results && judgeResponse.results.length > 0) {
        // Get financial disclosures for this judge
        const disclosureResponse = await makeApiRequest('/financial-disclosures/', {
          person: judgeResponse.results[0].id,
          year: year,
          limit: 100
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        if (disclosureResponse.results && disclosureResponse.results.length > 0) {
          params.financial_disclosure__in = disclosureResponse.results.map(d => d.id).join(',');
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `No financial disclosures found for judge: ${judge_name}`,
                count: 0,
                spouse_incomes: []
              })
            }]
          };
        }
      }
    }

    const response = await makeApiRequest('/spouse-incomes/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.count || response.results.length,
          spouse_incomes: response.results.map(income => ({
            id: income.id,
            source_type: income.source_type,
            date_raw: income.date_raw,
            financial_disclosure_id: income.financial_disclosure,
            redacted: income.redacted
          }))
        })
      }]
    };
  }

  async searchJudgeReimbursements(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      judge_name,
      source,
      purpose,
      location,
      year,
      limit = 20
    } = args;

    const validatedLimit = validateLimit(limit, 100);
    const params = {
      limit: validatedLimit
    };

    if (source) params.source__icontains = source;
    if (purpose) params.purpose__icontains = purpose;
    if (location) params.location__icontains = location;

    if (judge_name) {
      // Get judge ID first
      const judgeResponse = await makeApiRequest('/people/', {
        name: judge_name,
        limit: 1
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      
      if (judgeResponse.results && judgeResponse.results.length > 0) {
        // Get financial disclosures for this judge
        const disclosureResponse = await makeApiRequest('/financial-disclosures/', {
          person: judgeResponse.results[0].id,
          year: year,
          limit: 100
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        if (disclosureResponse.results && disclosureResponse.results.length > 0) {
          params.financial_disclosure__in = disclosureResponse.results.map(d => d.id).join(',');
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `No financial disclosures found for judge: ${judge_name}`,
                count: 0,
                reimbursements: []
              })
            }]
          };
        }
      }
    }

    const response = await makeApiRequest('/reimbursements/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.count || response.results.length,
          reimbursements: response.results.map(reimb => ({
            id: reimb.id,
            source: reimb.source,
            date_raw: reimb.date_raw,
            location: reimb.location,
            purpose: reimb.purpose,
            items_paid_or_provided: reimb.items_paid_or_provided,
            financial_disclosure_id: reimb.financial_disclosure,
            redacted: reimb.redacted
          }))
        })
      }]
    };
  }

  async searchJudgeDebts(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      judge_name,
      creditor_name,
      description,
      year,
      limit = 20
    } = args;

    const validatedLimit = validateLimit(limit, 100);
    const params = {
      limit: validatedLimit
    };

    if (creditor_name) params.creditor_name__icontains = creditor_name;
    if (description) params.description__icontains = description;

    if (judge_name) {
      // Get judge ID first
      const judgeResponse = await makeApiRequest('/people/', {
        name: judge_name,
        limit: 1
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      
      if (judgeResponse.results && judgeResponse.results.length > 0) {
        // Get financial disclosures for this judge
        const disclosureResponse = await makeApiRequest('/financial-disclosures/', {
          person: judgeResponse.results[0].id,
          year: year,
          limit: 100
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        if (disclosureResponse.results && disclosureResponse.results.length > 0) {
          params.financial_disclosure__in = disclosureResponse.results.map(d => d.id).join(',');
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `No financial disclosures found for judge: ${judge_name}`,
                count: 0,
                debts: []
              })
            }]
          };
        }
      }
    }

    const response = await makeApiRequest('/debts/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.count || response.results.length,
          debts: response.results.map(debt => ({
            id: debt.id,
            creditor_name: debt.creditor_name,
            description: debt.description,
            value_code: debt.value_code,
            financial_disclosure_id: debt.financial_disclosure,
            redacted: debt.redacted
          }))
        })
      }]
    };
  }

  async getDisclosurePositions(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      disclosure_id,
      judge_name,
      year,
      limit = 20
    } = args;

    const validatedLimit = validateLimit(limit, 100);
    const params = {
      limit: validatedLimit
    };

    if (disclosure_id) {
      params.financial_disclosure = disclosure_id;
    } else if (judge_name) {
      // Get judge ID first
      const judgeResponse = await makeApiRequest('/people/', {
        name: judge_name,
        limit: 1
      }, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      
      if (judgeResponse.results && judgeResponse.results.length > 0) {
        // Get financial disclosures for this judge
        const disclosureResponse = await makeApiRequest('/financial-disclosures/', {
          person: judgeResponse.results[0].id,
          year: year,
          limit: 100
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        if (disclosureResponse.results && disclosureResponse.results.length > 0) {
          params.financial_disclosure__in = disclosureResponse.results.map(d => d.id).join(',');
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `No financial disclosures found for judge: ${judge_name}`,
                count: 0,
                disclosure_positions: []
              })
            }]
          };
        }
      }
    }

    const response = await makeApiRequest('/disclosure-positions/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.count || response.results.length,
          disclosure_positions: response.results.map(pos => ({
            id: pos.id,
            position: pos.position,
            name_of_organization: pos.name_of_organization,
            financial_disclosure_id: pos.financial_disclosure,
            redacted: pos.redacted
          }))
        })
      }]
    };
  }
}