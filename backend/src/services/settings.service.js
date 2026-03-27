const db = require('../db/pool');

const SETTINGS_FIELDS_SQL = `
  id,
  business_name,
  hero_headline,
  hero_subtext,
  about_summary,
  contact_email,
  contact_phone,
  contact_facebook,
  contact_location
`;

const mapSettingsRow = (row) => ({
  aboutSummary: row.about_summary,
  businessName: row.business_name,
  contactEmail: row.contact_email,
  contactFacebook: row.contact_facebook,
  contactLocation: row.contact_location,
  contactPhone: row.contact_phone,
  heroHeadline: row.hero_headline,
  heroSubtext: row.hero_subtext,
  id: row.id,
});

const getSettings = async () => {
  const { rows } = await db.query(
    `
      SELECT ${SETTINGS_FIELDS_SQL}
      FROM site_settings
      WHERE id = 1
    `,
  );

  return mapSettingsRow(rows[0]);
};

const updateSettings = async (payload) => {
  const { rows } = await db.query(
    `
      UPDATE site_settings
      SET
        business_name = $1,
        hero_headline = $2,
        hero_subtext = $3,
        about_summary = $4,
        contact_email = $5,
        contact_phone = $6,
        contact_facebook = $7,
        contact_location = $8
      WHERE id = 1
      RETURNING ${SETTINGS_FIELDS_SQL}
    `,
    [
      payload.businessName,
      payload.heroHeadline,
      payload.heroSubtext,
      payload.aboutSummary,
      payload.contactEmail,
      payload.contactPhone,
      payload.contactFacebook,
      payload.contactLocation,
    ],
  );

  return mapSettingsRow(rows[0]);
};

module.exports = {
  getSettings,
  updateSettings,
};
