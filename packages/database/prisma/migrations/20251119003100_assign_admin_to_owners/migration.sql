-- Data migration: Assign admin role to all owners
UPDATE "OrgMember" 
SET roles = array_append(roles, 'admin'::"MemberRole")
WHERE "isOwner" = true AND NOT ('admin' = ANY(roles));
