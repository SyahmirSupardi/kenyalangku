-- Android testers choose their phone or tablet brand and type its model.
ALTER TABLE alpha_claims ADD COLUMN device_brand TEXT;
ALTER TABLE alpha_claims ADD COLUMN device_model TEXT;
