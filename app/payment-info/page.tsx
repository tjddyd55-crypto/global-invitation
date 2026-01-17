import styles from './page.module.css'

export default function PaymentInfoPage() {
  return (
    <div className={styles.container}>
      <h1>Payment Information</h1>

      <section className={styles.section}>
        <h2>Service Overview</h2>
        <p>
          Global Invitation is a digital platform that allows users to create and share
          online invitations for weddings, events, and special occasions.
        </p>
        <p>
          All invitations are created and delivered digitally.
          No physical goods are sold.
        </p>
      </section>

      <section className={styles.section}>
        <h2>How It Works</h2>
        <p>
          Users can create invitations for free.
          A one-time payment is required to unlock sharing features
          for each invitation.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Pricing</h2>
        <p>
          Planned Pricing
        </p>
        <p>
          USD $39 per invitation (one-time payment)
        </p>
        <p>
          Users can edit their invitation freely before the event date.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Refund Policy</h2>
        <p>
          Due to the nature of digital services,
          payments are non-refundable once the invitation sharing feature is activated.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Customer Support</h2>
        <p>
          Email: tjddyd55@gmail.com
        </p>
      </section>
    </div>
  )
}
