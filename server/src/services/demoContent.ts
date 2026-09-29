export const DEMO_EXPLANATION_SIMPLE = `## Database Normalization - Simple Explanation

**What is Database Normalization?**
Database normalization is like organizing your closet. Instead of throwing everything in one big pile, you sort items into different shelves and drawers so everything is easy to find and nothing is duplicated.

**Why do we need it?**
Imagine you have a spreadsheet where you store student information. If a student is enrolled in 3 courses, you might have their name and address written 3 times. If they move, you'd have to update 3 rows! Normalization fixes this problem.

**The Three Main Normal Forms:**

1. **First Normal Form (1NF):** Each cell should contain only one value. No lists or groups crammed into a single cell.
   - ❌ Courses: "Math, Science, English"
   - ✅ One row per course per student

2. **Second Normal Form (2NF):** Everything in the 1NF, plus every non-key column must depend on the entire primary key, not just part of it.
   - If your key is (StudentID + CourseID), then the student's address should be in a separate table because it only depends on StudentID.

3. **Third Normal Form (3NF):** Everything in 2NF, plus no non-key column should depend on another non-key column.
   - If you store DepartmentName and DepartmentHead, the head depends on the department, not on the student. Move it to a Department table.

**Key Terms:**
- **Redundancy:** Storing the same data in multiple places
- **Anomaly:** Problems that arise from redundancy (update, insert, delete anomalies)
- **Primary Key:** A unique identifier for each row
- **Functional Dependency:** When one attribute determines another

**Benefits:** Less wasted storage, fewer errors when updating data, and a cleaner database design.`;

export const DEMO_EXPLANATION_DETAILED = `## Database Normalization - Detailed Explanation

### Introduction
Database normalization is a systematic approach to organizing data in a relational database. Developed by Edgar F. Codd in 1970, it aims to reduce data redundancy and improve data integrity by structuring tables according to a series of rules called "normal forms."

### The Problem Normalization Solves
Consider an unnormalized table storing student enrollments:

| StudentID | Name | Address | CourseID | CourseName | InstructorName |
|-----------|------|---------|----------|------------|----------------|
| 101 | Alice | 123 Main St | CS101 | Intro to CS | Dr. Smith |
| 101 | Alice | 123 Main St | MATH201 | Calculus | Dr. Johnson |
| 102 | Bob | 456 Oak Ave | CS101 | Intro to CS | Dr. Smith |

This design has three types of anomalies:
- **Update Anomaly:** If Alice moves, we must update multiple rows.
- **Insert Anomaly:** We cannot add a new course until a student enrolls.
- **Delete Anomaly:** If Bob drops CS101, we might lose the course information.

### Normal Forms

**First Normal Form (1NF):**
- All columns contain atomic (indivisible) values.
- Each row is unique (has a primary key).
- No repeating groups or arrays.

**Second Normal Form (2NF):**
- Must be in 1NF.
- Every non-key attribute must depend on the entire primary key (no partial dependencies).
- Separate data that only depends on part of a composite key.

**Third Normal Form (3NF):**
- Must be in 2NF.
- No transitive dependencies: non-key attributes must not depend on other non-key attributes.
- Example: If CourseName → InstructorName, this is a transitive dependency through CourseName.

### Normalization Steps Applied

**Students Table:** StudentID (PK), Name, Address
**Courses Table:** CourseID (PK), CourseName, InstructorID (FK)
**Instructors Table:** InstructorID (PK), InstructorName
**Enrollments Table:** StudentID (FK), CourseID (FK)

### Key Definitions
- **Redundancy:** Unnecessary duplication of data across rows
- **Functional Dependency:** Attribute A → B means knowing A uniquely determines B
- **Primary Key:** Minimal set of attributes that uniquely identifies a row
- **Foreign Key:** An attribute referencing a primary key in another table
- **Decomposition:** Splitting a table into smaller tables without losing information

### Trade-offs
Normalization reduces redundancy but may require more JOIN operations, which can impact query performance. In practice, some controlled denormalization is common in read-heavy applications.`;

export const DEMO_TRANSLATION_HINDI = `## डेटाबेस नॉर्मलाइज़ेशन - सरल व्याख्या

**डेटाबेस नॉर्मलाइज़ेशन क्या है?**
डेटाबेस नॉर्मलाइज़ेशन आपकी अलमारी को व्यवस्थित करने जैसा है। सब कुछ एक बड़े ढेर में फेंकने के बजाय, आप चीजों को अलग-अलग अलमारियों और दराजों में रखते हैं ताकि सब कुछ आसानी से मिल सके और कुछ भी दोहराया न जाए।

**इसकी आवश्यकता क्यों है?**
कल्पना कीजिए कि आपके पास एक स्प्रेडशीट है जिसमें छात्र की जानकारी है। यदि एक छात्र 3 पाठ्यक्रमों में नामांकित है, तो उनका नाम और पता 3 बार लिखा जा सकता है। यदि वे स्थानांतरित होते हैं, तो आपको 3 पंक्तियाँ अपडेट करनी होंगी!

**तीन मुख्य नॉर्मल फॉर्म:**

1. **प्रथम नॉर्मल फॉर्म (1NF):** प्रत्येक सेल में केवल एक मान होना चाहिए।
2. **द्वितीय नॉर्मल फॉर्म (2NF):** प्रत्येक गैर-कुंजी स्तंभ पूरी प्राथमिक कुंजी पर निर्भर होना चाहिए।
3. **तृतीय नॉर्मल फॉर्म (3NF):** कोई भी गैर-कुंजी स्तंभ किसी अन्य गैर-कुंजी स्तंभ पर निर्भर नहीं होना चाहिए।

**मुख्य शब्द:**
- **रिडंडेंसी (Redundancy):** एक ही डेटा को कई जगह संग्रहित करना
- **एनोमली (Anomaly):** रिडंडेंसी से उत्पन्न समस्याएं
- **प्राइमरी कुंजी (Primary Key):** प्रत्येक पंक्ति के लिए एक अद्वितीय पहचानकर्ता
- **फंक्शनल डिपेंडेंसी (Functional Dependency):** जब एक विशेषता दूसरी को निर्धारित करती है`;

export const DEMO_TRANSLATION_MARATHI = `## डेटाबेस नॉर्मलायझेशन - सोपे स्पष्टीकरण

**डेटाबेस नॉर्मलायझेशन म्हणजे काय?**
डेटाबेस नॉर्मलायझेशन म्हणजे तुमचे कपाट व्यवस्थित करण्यासारखे आहे. सगळे एका मोठ्या ढिगाऱ्यात टाकण्याऐवजी, तुम्ही वस्तू वेगवेगळ्या कप्प्यांमध्ये ठेवता जेणेकरून सगळे सहज सापडते आणि काहीही दुप्पट होत नाही.

**याची गरज का आहे?**
कल्पना करा की तुमच्याकडे विद्यार्थ्यांची माहिती असलेली स्प्रेडशीट आहे. जर एक विद्यार्थी 3 अभ्यासक्रमांमध्ये नोंदणीकृत असेल, तर त्यांचे नाव आणि पत्ता 3 वेळा लिहिलेला असू शकतो.

**तीन मुख्य नॉर्मल फॉर्म:**

1. **पहिला नॉर्मल फॉर्म (1NF):** प्रत्येक सेलमध्ये फक्त एकच मूल्य असावे.
2. **दुसरा नॉर्मल फॉर्म (2NF):** प्रत्येक नॉन-की कॉलम संपूर्ण प्राथमिक कीवर अवलंबून असावा.
3. **तिसरा नॉर्मल फॉर्म (3NF):** कोणताही नॉन-की कॉलम दुसऱ्या नॉन-की कॉलमवर अवलंबून नसावा.

**मुख्य संज्ञा:**
- **रिडंडन्सी (Redundancy):** एकच डेटा अनेक ठिकाणी साठवणे
- **अ‍ॅनोमली (Anomaly):** रिडंडन्सीमुळे निर्माण होणाऱ्या समस्या
- **प्राइमरी की (Primary Key):** प्रत्येक ओळीसाठी एक अद्वितीय ओळखकर्ता
- **फंक्शनल डिपेंडन्सी (Functional Dependency):** जेव्हा एक गुणधर्म दुसऱ्याला ठरवतो`;

export const DEMO_TRANSLATION_KONKANI = `## डेटाबेस नॉर्मलायझेशन - सोंपें स्पष्टीकरण

**डेटाबेस नॉर्मलायझेशन म्हणजे कितें?**
डेटाबेस नॉर्मलायझेशन म्हणजे तुमचें कपाट नीट दवरपा सारकें. सगळें एका व्हडल्या ढिगाऱ्यांत उडोवपा बदलाक, तुमी वस्तू वेगवेगळ्या कप्प्यांनी दवरतात जाल्यार सगळें सोंपेपणान मेळटा.

**हाची गरज कित्याक?**
कल्पना करात की तुमचे कडेन विद्यार्थ्यांची म्हायती आशिल्ली स्प्रेडशीट आसा. जर एक विद्यार्थी 3 अभ्यासक्रमांनी नोंदणीकृत आसत जाल्यार, ताणचें नांव आनी पत्तो 3 फावटी बरयल्लो आसूं येता.

**तीन मुखेल नॉर्मल फॉर्म:**

1. **पयलो नॉर्मल फॉर्म (1NF):** दर सेलांत फकत एकूच मोल आसचें.
2. **दुसरो नॉर्मल फॉर्म (2NF):** दर नॉन-की कॉलम पुराय प्रायमरी कीचेर अवलंबून आसचो.
3. **तिसरो नॉर्मल फॉर्म (3NF):** खंयचोय नॉन-की कॉलम दुसऱ्या नॉन-की कॉलमाचेर अवलंबून आसचो न्हय.`;

export const DEMO_QUIZ = {
  questions: [
    {
      id: 1,
      question: 'What is the primary goal of database normalization?',
      options: [
        'To make the database run faster',
        'To reduce data redundancy and improve data integrity',
        'To add more tables to the database',
        'To encrypt sensitive data',
      ],
      correctAnswer: 1,
      explanation: 'Database normalization aims to reduce data redundancy (storing the same data in multiple places) and improve data integrity by organizing data into well-structured tables.',
    },
    {
      id: 2,
      question: 'What does First Normal Form (1NF) require?',
      options: [
        'No foreign keys in any table',
        'Each cell must contain only one atomic (indivisible) value',
        'All tables must have exactly 3 columns',
        'Every table must have an auto-increment primary key',
      ],
      correctAnswer: 1,
      explanation: 'First Normal Form (1NF) requires that each cell contains only one atomic (indivisible) value. No lists or repeating groups are allowed in a single cell.',
    },
    {
      id: 3,
      question: 'What type of anomaly occurs when you cannot add new data without unrelated data being present?',
      options: [
        'Delete Anomaly',
        'Update Anomaly',
        'Insert Anomaly',
        'Read Anomaly',
      ],
      correctAnswer: 2,
      explanation: 'An Insert Anomaly occurs when you cannot insert new data into the database without the presence of other unrelated data. For example, you cannot add a new course until a student enrolls in it.',
    },
    {
      id: 4,
      question: 'In Second Normal Form (2NF), what must be eliminated?',
      options: [
        'All primary keys',
        'Partial dependencies on composite keys',
        'All foreign key relationships',
        'Transitive dependencies',
      ],
      correctAnswer: 1,
      explanation: 'Second Normal Form (2NF) requires eliminating partial dependencies, where a non-key attribute depends on only part of a composite primary key rather than the entire key.',
    },
    {
      id: 5,
      question: 'What is a functional dependency in database design?',
      options: [
        'When a database function calls another function',
        'When two tables are joined together',
        'When knowing one attribute uniquely determines another attribute',
        'When a column can store multiple data types',
      ],
      correctAnswer: 2,
      explanation: 'A functional dependency (A → B) means that knowing the value of attribute A uniquely determines the value of attribute B. For example, StudentID → StudentName.',
    },
  ],
};

export function getDemoExplanation(level: string, style: string): string {
  if (style === 'detailed' || level === 'college') {
    return DEMO_EXPLANATION_DETAILED;
  }
  return DEMO_EXPLANATION_SIMPLE;
}

export function getDemoTranslation(targetLang: string): string {
  switch (targetLang) {
    case 'hi': return DEMO_TRANSLATION_HINDI;
    case 'mr': return DEMO_TRANSLATION_MARATHI;
    case 'kok': return DEMO_TRANSLATION_KONKANI;
    default: return DEMO_EXPLANATION_SIMPLE;
  }
}
