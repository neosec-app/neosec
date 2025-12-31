const { sequelize } = require('./config/db');

async function checkTables() {
  try {
    const [groupsResult] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups'");
    console.log('Groups table exists:', groupsResult.length > 0);

    const [membersResult] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members'");
    console.log('Group members table exists:', membersResult.length > 0);

    const [userResult] = await sequelize.query('SELECT id, email, "accountType", "subscriptionTier" FROM users WHERE "accountType" = \'leader\' LIMIT 5');
    console.log('Leader users found:', userResult.length);
    if (userResult.length > 0) {
      console.log('Sample leader:', userResult[0]);
    }

    const [groups] = await sequelize.query('SELECT id, name, "leaderId" FROM groups LIMIT 5');
    console.log('Existing groups:', groups.length);
    if (groups.length > 0) {
      console.log('Sample group:', groups[0]);
    }

    // Check invitations table
    const [invitationsResult] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitations'");
    console.log('Invitations table exists:', invitationsResult.length > 0);

    if (invitationsResult.length > 0) {
      const [invitations] = await sequelize.query('SELECT id, "groupId", "inviteeEmail", status FROM invitations LIMIT 5');
      console.log('Existing invitations:', invitations.length);
      if (invitations.length > 0) {
        console.log('Sample invitation:', invitations[0]);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  sequelize.close();
}

checkTables();
