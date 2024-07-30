// CREATE OR REPLACE VIEW project_with_artifacts_view AS
// WITH project_tags AS (
//     SELECT pt.project_id,
//            json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS tags
//     FROM project_tag pt
//     JOIN tag t ON pt.tag_id = t.id
//     GROUP BY pt.project_id
// ),
// artifact_contents AS (
//     SELECT ac.artifact_id,
//            json_agg(DISTINCT jsonb_build_object(
//                'id', ac.id,
//                'type', ac.type,
//                'content', ac.content,
//                'metadata', ac.metadata,
//                'created_at', ac.created_at,
//                'updated_at', ac.updated_at,
//                'created_by', ac.created_by,
//                'last_modified_by', ac.last_modified_by
//            )) AS contents
//     FROM artifact_content ac
//     GROUP BY ac.artifact_id
// ),
// project_artifacts AS (
//     SELECT pal.project_id,
//            json_agg(DISTINCT jsonb_build_object(
//                'id', a.id,
//                'name', a.name,
//                'description', a.description,
//                'created_at', a.created_at,
//                'updated_at', a.updated_at,
//                'contents', COALESCE(ac.contents, '[]'::json)
//            )) AS artifacts
//     FROM project_artifact_link pal
//     JOIN artifact a ON pal.artifact_id = a.id
//     LEFT JOIN artifact_contents ac ON a.id = ac.artifact_id
//     GROUP BY pal.project_id
// )
// SELECT
//     p.id,
//     p.account_id,
//     p.name,
//     p.description,
//     p.created_at,
//     p.updated_at,
//     p.status,
//     COALESCE(pt.tags, '[]'::json) AS tags,
//     COALESCE(pa.artifacts, '[]'::json) AS artifacts
// FROM
//     project p
// LEFT JOIN project_tags pt ON p.id = pt.project_id
// LEFT JOIN project_artifacts pa ON p.id = pa.project_id;