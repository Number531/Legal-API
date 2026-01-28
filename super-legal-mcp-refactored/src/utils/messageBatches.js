export async function createBatch(anthropic, requests) {
  return anthropic.batches.create({ requests });
}

export async function getBatchStatus(anthropic, batchId) {
  return anthropic.batches.retrieve(batchId);
}

export async function getBatchResults(anthropic, batchId) {
  const status = await getBatchStatus(anthropic, batchId);
  if (status.status === 'ended') {
    return anthropic.batches.results(batchId);
  }
  return { status: status.status, message: 'Batch not complete' };
}

