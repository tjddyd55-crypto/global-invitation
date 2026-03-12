'use client';
/* eslint-disable i18next/no-literal-string */

import styles from './TemplateCreatorStudio.module.css';

type SubmissionActionsProps = {
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  canSubmit: boolean;
  saving: boolean;
  submitting: boolean;
  onSave: () => Promise<void> | void;
  onSubmit: () => Promise<void> | void;
  onCreateRevision?: () => Promise<void> | void;
};

export default function SubmissionActions({
  status,
  canSubmit,
  saving,
  submitting,
  onSave,
  onSubmit,
  onCreateRevision,
}: SubmissionActionsProps) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Submission Actions</h2>
      <div className={styles.stack}>
        <p className={styles.helperText}>Current status: {status}</p>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.button}
            onClick={() => void onSave()}
            disabled={saving || submitting || status === 'APPROVED'}
            data-testid="creator-save-draft-button"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => void onSubmit()}
            disabled={!canSubmit || saving || submitting || status === 'APPROVED'}
            data-testid="creator-submit-review-button"
          >
            {submitting ? 'Submitting...' : status === 'REJECTED' ? 'Resubmit for Review' : 'Submit for Review'}
          </button>
        </div>
        {status === 'APPROVED' && onCreateRevision && (
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => void onCreateRevision()}
            disabled={saving || submitting}
          >
            Create New Revision
          </button>
        )}
      </div>
    </section>
  );
}
