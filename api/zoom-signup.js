const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const { name, email, company } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    if (company || !cleanName || cleanName.length > 80 || !emailIsValid || cleanEmail.length > 254) {
        return res.status(400).json({ error: 'Please provide a valid name and email address.' });
    }

    if (!process.env.BREVO_API_KEY) {
        console.error('BREVO_API_KEY is not configured.');
        return res.status(500).json({ error: 'Email service is not configured.' });
    }

    const zoomLink = 'https://us06web.zoom.us/j/86791467846?pwd=Wq2b7ELboKx3kbrwVrzXXddAy3ISxI.1';
    const safeName = escapeHtml(cleanName);
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify({
            sender: { name: 'Sisterhood Circle', email: 'Piecebypeace0128@gmail.com' },
            to: [{ email: cleanEmail, name: cleanName }],
            subject: 'Your Sisterhood Circle Zoom Link — October 4, 2026',
            htmlContent: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#292929;line-height:1.6;">
                    <h1 style="color:#c99020;">Sisterhood Circle</h1>
                    <p>Hello ${safeName},</p>
                    <p>Thank you for joining Sisterhood Circle. We are excited to see you at our upcoming gathering.</p>
                    <p><strong>Date:</strong> Sunday, October 4, 2026<br><strong>Time:</strong> 6:00 PM Eastern Time (US and Canada)</p>
                    <p style="margin:28px 0;"><a href="${zoomLink}" style="background:#c99020;color:#ffffff;padding:14px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">Join Zoom Meeting</a></p>
                    <p><strong>Meeting ID:</strong> 867 9146 7846<br><strong>Passcode:</strong> 449857</p>
                    <p>With love,<br>Sisterhood Circle</p>
                </div>`
        })
    });

    if (!emailResponse.ok) {
        console.error('Brevo request failed:', emailResponse.status);
        return res.status(502).json({ error: 'Could not send the invitation.' });
    }

    return res.status(200).json({ message: 'Invitation sent.' });
};
