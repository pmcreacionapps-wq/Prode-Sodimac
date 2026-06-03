-- =============================================================
-- DB Trigger: Auto-lock predictions at kickoff
-- Run in Supabase SQL Editor
-- =============================================================

-- Function: lock predictions when match status changes to LIVE or FINISHED
CREATE OR REPLACE FUNCTION lock_predictions_on_kickoff()
RETURNS TRIGGER AS $$
BEGIN
  -- When a match transitions to LIVE or FINISHED, lock its predictions
  IF NEW.status IN ('LIVE', 'FINISHED') AND OLD.status = 'SCHEDULED' THEN
    UPDATE "Match"
    SET "predictionsLocked" = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Match status changes
DROP TRIGGER IF EXISTS trigger_lock_predictions ON "Match";
CREATE TRIGGER trigger_lock_predictions
  AFTER UPDATE OF status ON "Match"
  FOR EACH ROW
  EXECUTE FUNCTION lock_predictions_on_kickoff();

-- =============================================================
-- Function: Prevent prediction inserts on locked matches
-- =============================================================
CREATE OR REPLACE FUNCTION prevent_locked_prediction()
RETURNS TRIGGER AS $$
DECLARE
  match_locked BOOLEAN;
  match_kickoff TIMESTAMPTZ;
BEGIN
  SELECT "predictionsLocked", "kickoffAt"
  INTO match_locked, match_kickoff
  FROM "Match"
  WHERE id = NEW."matchId";

  IF match_locked OR match_kickoff <= NOW() THEN
    RAISE EXCEPTION 'Predictions are locked for this match';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Prediction inserts/updates
DROP TRIGGER IF EXISTS trigger_prevent_locked_prediction ON "Prediction";
CREATE TRIGGER trigger_prevent_locked_prediction
  BEFORE INSERT OR UPDATE ON "Prediction"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_prediction();
