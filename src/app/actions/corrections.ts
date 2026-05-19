"use server";

import { supabase } from "@/lib/supabase";

export interface CorrectionInput {
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  field_name?: string;
  current_value?: string;
  suggested_value: string;
  reason?: string;
  submitter_email?: string;
  source_url?: string;
}

export async function submitCorrection(
  data: CorrectionInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const { error } = await supabase.from("corrections").insert({
    entity_type:     data.entity_type,
    entity_id:       data.entity_id       || null,
    entity_name:     data.entity_name     || null,
    field_name:      data.field_name      || null,
    current_value:   data.current_value   || null,
    suggested_value: data.suggested_value,
    reason:          data.reason          || null,
    submitter_email: data.submitter_email || null,
    source_url:      data.source_url      || null,
    status:          "pending",
  });

  if (error) {
    console.error("[corrections] insert error:", error.message);
    return { success: false, error: "Unable to submit correction. Please try again." };
  }

  return { success: true };
}
