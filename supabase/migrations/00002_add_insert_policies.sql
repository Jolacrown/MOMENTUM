-- Add INSERT policies for tables that only have SELECT/ALL policies
-- These allow any authenticated user to insert data as needed by the app

-- Resources: Allow authenticated users to insert
CREATE POLICY "Users can insert resources"
ON resources FOR INSERT
TO authenticated
WITH CHECK (true);

-- Recommendations: Allow authenticated users to insert
CREATE POLICY "Users can insert recommendations"
ON recommendations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Reports: Allow authenticated users to insert
CREATE POLICY "Users can insert reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (true);

-- Resource Analytics: Allow authenticated users to insert
CREATE POLICY "Users can insert resource analytics"
ON resource_analytics FOR INSERT
TO authenticated
WITH CHECK (true);
