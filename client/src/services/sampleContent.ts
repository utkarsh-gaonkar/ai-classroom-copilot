export const SAMPLE_LESSON = {
	title: 'Database Normalization',
	content: `Database Normalization

Database normalization is a systematic way to organize data in relational tables. It reduces duplicated data and helps keep information accurate when records are added, changed, or removed.

Consider a table that stores student names, addresses, courses, and instructor names in every enrollment row. If a student's address changes, several rows may need to be updated. If one is missed, the database contains inconsistent information.

First Normal Form (1NF): Each cell contains one atomic value. A cell should not contain a list such as "Math, Science, English".

Second Normal Form (2NF): The table is in 1NF, and every non-key attribute depends on the entire primary key. With a StudentID and CourseID composite key, a student's address depends on StudentID alone and belongs in a Students table.

Third Normal Form (3NF): The table is in 2NF, and non-key attributes do not depend on other non-key attributes. Course details should be stored with the course rather than repeated for every student.

Normalization reduces redundancy and update, insert, and delete anomalies. It usually means using more tables and joins, so some systems make carefully chosen performance trade-offs.`,
}
