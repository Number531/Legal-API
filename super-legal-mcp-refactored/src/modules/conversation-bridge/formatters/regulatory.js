/**
 * Regulatory Agency Tool Formatters
 * Formats results from FTC, FDA, CPSC, and NHTSA tools for conversation display
 */

/**
 * Format FTC HSR termination results
 */
export function formatFTCHSRTerminations(result) {
  if (!result || !result.results || result.results.length === 0) {
    return {
      summary: "No FTC HSR termination notices found",
      keyFindings: [],
      conversationDisplay: "🏛️ **FTC HSR Terminations**: No termination notices found"
    };
  }

  try {
    const results = result.results.slice(0, 5); // Limit to first 5 results
    const keyFindings = [];
    
    results.forEach(item => {
      if (item.title && item.title.toLowerCase().includes('early termination')) {
        keyFindings.push(`Early termination: ${item.title.substring(0, 100)}`);
      }
    });

    const summary = `Found ${result.results.length} FTC HSR termination notices`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `🏛️ **FTC HSR Terminations**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting FTC HSR termination results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🏛️ **FTC HSR Terminations**: Error formatting results"
    };
  }
}

/**
 * Format FTC enforcement action results
 */
export function formatFTCEnforcementActions(result) {
  if (!result || !result.results || result.results.length === 0) {
    return {
      summary: "No FTC enforcement actions found",
      keyFindings: [],
      conversationDisplay: "⚖️ **FTC Enforcement Actions**: No enforcement actions found"
    };
  }

  try {
    const results = result.results.slice(0, 5);
    const keyFindings = [];
    
    results.forEach(item => {
      if (item.title) {
        const title = item.title.toLowerCase();
        if (title.includes('consent') || title.includes('settlement')) {
          keyFindings.push(`Settlement/Consent: ${item.title.substring(0, 100)}`);
        } else if (title.includes('complaint') || title.includes('action')) {
          keyFindings.push(`Enforcement action: ${item.title.substring(0, 100)}`);
        }
      }
    });

    const summary = `Found ${result.results.length} FTC enforcement actions`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `⚖️ **FTC Enforcement Actions**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting FTC enforcement action results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "⚖️ **FTC Enforcement Actions**: Error formatting results"
    };
  }
}

/**
 * Format FDA drug adverse events results
 */
export function formatFDADrugAdverseEvents(result) {
  if (!result || !result.results || result.results.length === 0) {
    return {
      summary: "No FDA drug adverse events found",
      keyFindings: [],
      conversationDisplay: "💊 **FDA Drug Adverse Events**: No adverse events found"
    };
  }

  try {
    const results = result.results.slice(0, 10);
    const keyFindings = [];
    
    // Analyze adverse events
    let seriousEvents = 0;
    let deathEvents = 0;
    const reportedDrugs = new Set();

    results.forEach(event => {
      if (event.serious && event.serious === "1") {
        seriousEvents++;
      }
      if (event.seriousnesscongenitalanomali === "1" || event.seriousnessdeath === "1") {
        deathEvents++;
      }
      if (event.patient && event.patient.drug) {
        event.patient.drug.forEach(drug => {
          if (drug.medicinalproduct) {
            reportedDrugs.add(drug.medicinalproduct);
          }
        });
      }
    });

    keyFindings.push(`Total adverse events: ${result.results.length}`);
    if (seriousEvents > 0) keyFindings.push(`Serious events: ${seriousEvents}`);
    if (deathEvents > 0) keyFindings.push(`Fatal events: ${deathEvents}`);
    keyFindings.push(`Unique drugs reported: ${reportedDrugs.size}`);

    const summary = `Found ${result.results.length} FDA adverse drug events`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `💊 **FDA Drug Adverse Events**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting FDA adverse events results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "💊 **FDA Drug Adverse Events**: Error formatting results"
    };
  }
}

/**
 * Format FDA device events results
 */
export function formatFDADeviceEvents(result) {
  if (!result || !result.results || result.results.length === 0) {
    return {
      summary: "No FDA device events found",
      keyFindings: [],
      conversationDisplay: "🔧 **FDA Device Events**: No device events found"
    };
  }

  try {
    const results = result.results.slice(0, 10);
    const keyFindings = [];
    
    let seriousEvents = 0;
    const deviceTypes = new Set();
    const manufacturers = new Set();

    results.forEach(event => {
      if (event.event_type && event.event_type.toLowerCase().includes('malfunction')) {
        seriousEvents++;
      }
      if (event.device && event.device[0]) {
        const device = event.device[0];
        if (device.generic_name) deviceTypes.add(device.generic_name);
        if (device.manufacturer_d_name) manufacturers.add(device.manufacturer_d_name);
      }
    });

    keyFindings.push(`Total device events: ${result.results.length}`);
    if (seriousEvents > 0) keyFindings.push(`Malfunction events: ${seriousEvents}`);
    keyFindings.push(`Device types: ${deviceTypes.size}`);
    keyFindings.push(`Manufacturers: ${manufacturers.size}`);

    const summary = `Found ${result.results.length} FDA device events`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `🔧 **FDA Device Events**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting FDA device events results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🔧 **FDA Device Events**: Error formatting results"
    };
  }
}

/**
 * Format FDA recalls results
 */
export function formatFDARecalls(result) {
  if (!result || !result.results || result.results.length === 0) {
    return {
      summary: "No FDA recalls found",
      keyFindings: [],
      conversationDisplay: "🚨 **FDA Recalls**: No recalls found"
    };
  }

  try {
    const results = result.results.slice(0, 10);
    const keyFindings = [];
    
    let classI = 0, classII = 0, classIII = 0;
    const recallReasons = new Set();

    results.forEach(recall => {
      if (recall.classification) {
        switch (recall.classification.toLowerCase()) {
          case 'class i': classI++; break;
          case 'class ii': classII++; break;
          case 'class iii': classIII++; break;
        }
      }
      if (recall.reason_for_recall) {
        recallReasons.add(recall.reason_for_recall.substring(0, 50));
      }
    });

    keyFindings.push(`Total recalls: ${result.results.length}`);
    if (classI > 0) keyFindings.push(`Class I (most serious): ${classI}`);
    if (classII > 0) keyFindings.push(`Class II: ${classII}`);
    if (classIII > 0) keyFindings.push(`Class III: ${classIII}`);

    const summary = `Found ${result.results.length} FDA recalls`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `🚨 **FDA Recalls**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting FDA recalls results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🚨 **FDA Recalls**: Error formatting results"
    };
  }
}

/**
 * Format CPSC recalls results
 */
export function formatCPSCRecalls(result) {
  if (!result || !result.results || result.results.length === 0) {
    return {
      summary: "No CPSC recalls found",
      keyFindings: [],
      conversationDisplay: "🛡️ **CPSC Recalls**: No consumer product recalls found"
    };
  }

  try {
    const results = result.results.slice(0, 10);
    const keyFindings = [];
    
    const hazardTypes = new Set();
    let injuryReports = 0;

    results.forEach(recall => {
      if (recall.hazard_type) {
        hazardTypes.add(recall.hazard_type);
      }
      if (recall.injury_count && parseInt(recall.injury_count) > 0) {
        injuryReports += parseInt(recall.injury_count);
      }
    });

    keyFindings.push(`Total recalls: ${result.results.length}`);
    keyFindings.push(`Hazard types: ${Array.from(hazardTypes).slice(0, 3).join(', ')}`);
    if (injuryReports > 0) keyFindings.push(`Total injuries reported: ${injuryReports}`);

    const summary = `Found ${result.results.length} CPSC consumer product recalls`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `🛡️ **CPSC Recalls**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting CPSC recalls results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🛡️ **CPSC Recalls**: Error formatting results"
    };
  }
}

/**
 * Format NHTSA VIN decode results
 */
export function formatNHTSAVinDecode(result) {
  if (!result || !result.Results || result.Results.length === 0) {
    return {
      summary: "Unable to decode VIN",
      keyFindings: [],
      conversationDisplay: "🚗 **NHTSA VIN Decode**: Unable to decode VIN"
    };
  }

  try {
    const results = result.Results;
    const keyFindings = [];
    
    const vehicleData = {};
    results.forEach(item => {
      if (item.Value && item.Value !== 'Not Applicable' && item.Value !== '') {
        vehicleData[item.Variable] = item.Value;
      }
    });

    if (vehicleData.Make) keyFindings.push(`Make: ${vehicleData.Make}`);
    if (vehicleData.Model) keyFindings.push(`Model: ${vehicleData.Model}`);
    if (vehicleData.ModelYear) keyFindings.push(`Year: ${vehicleData.ModelYear}`);
    if (vehicleData.VehicleType) keyFindings.push(`Type: ${vehicleData.VehicleType}`);

    const summary = `Successfully decoded VIN for ${vehicleData.Make || 'unknown'} ${vehicleData.Model || 'vehicle'}`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `🚗 **NHTSA VIN Decode**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting NHTSA VIN decode results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🚗 **NHTSA VIN Decode**: Error formatting results"
    };
  }
}

/**
 * Format NHTSA recalls results
 */
export function formatNHTSARecalls(result) {
  if (!result || !result.Results || result.Results.length === 0) {
    return {
      summary: "No NHTSA recalls found",
      keyFindings: [],
      conversationDisplay: "🚗 **NHTSA Recalls**: No vehicle recalls found"
    };
  }

  try {
    const results = result.Results.slice(0, 10);
    const keyFindings = [];
    
    const recallTypes = new Set();
    let totalVehicles = 0;

    results.forEach(recall => {
      if (recall.Component) {
        recallTypes.add(recall.Component);
      }
      if (recall.PotentialUnitsAffected) {
        totalVehicles += parseInt(recall.PotentialUnitsAffected) || 0;
      }
    });

    keyFindings.push(`Total recalls: ${result.Results.length}`);
    keyFindings.push(`Vehicles affected: ${totalVehicles.toLocaleString()}`);
    keyFindings.push(`Components: ${Array.from(recallTypes).slice(0, 3).join(', ')}`);

    const summary = `Found ${result.Results.length} NHTSA vehicle recalls affecting ${totalVehicles.toLocaleString()} vehicles`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `🚗 **NHTSA Recalls**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting NHTSA recalls results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🚗 **NHTSA Recalls**: Error formatting results"
    };
  }
}

/**
 * Format NHTSA complaints results
 */
export function formatNHTSAComplaints(result) {
  if (!result || !result.Results || result.Results.length === 0) {
    return {
      summary: "No NHTSA complaints found",
      keyFindings: [],
      conversationDisplay: "🚗 **NHTSA Complaints**: No vehicle complaints found"
    };
  }

  try {
    const results = result.Results.slice(0, 10);
    const keyFindings = [];
    
    const complaintTypes = new Set();
    const components = new Set();

    results.forEach(complaint => {
      if (complaint.Component) {
        components.add(complaint.Component);
      }
      if (complaint.Summary) {
        // Extract key complaint themes
        const summary = complaint.Summary.toLowerCase();
        if (summary.includes('accident') || summary.includes('crash')) {
          complaintTypes.add('Accident/Crash related');
        }
        if (summary.includes('fire') || summary.includes('burn')) {
          complaintTypes.add('Fire/Thermal related');
        }
        if (summary.includes('stall') || summary.includes('engine')) {
          complaintTypes.add('Engine/Performance');
        }
      }
    });

    keyFindings.push(`Total complaints: ${result.Results.length}`);
    keyFindings.push(`Components: ${Array.from(components).slice(0, 3).join(', ')}`);
    if (complaintTypes.size > 0) {
      keyFindings.push(`Issue types: ${Array.from(complaintTypes).slice(0, 2).join(', ')}`);
    }

    const summary = `Found ${result.Results.length} NHTSA vehicle complaints`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `🚗 **NHTSA Complaints**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting NHTSA complaints results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🚗 **NHTSA Complaints**: Error formatting results"
    };
  }
}