==============================
HOW TO USE & UPDATE THE WIDGET
==============================


FILLING OUT THE JSON FILE
-------------------------
The order of the assignments in the JSON file does not matter; they will be sorted automatically when they are processed
The "type" field is not case-sensitive. You can type "quiz" or "Quiz" or "QUIZ" or "QuIz", and it will be processed as "quiz".
Current list of valid assignment types:
    * quiz
    * discussion
    * code
    * assignment
Invalid assignment types will be processed as an "assignment"
In the "link" field, add the LEARN quicklink to the assignment page
You can check if your JSON formatting is correct by using a JSON validator

DATE FORMATTING
---------------
Due dates must be in the format "YYYY-MM-DD" + "T" for time + "HH:MM:SS"
Example: YYYY-MM-DDTHH:MM:SS
All times are automatically put in EST
If a date is not formatted correctly:
    * All the dates in the list except for that one will still go through
    * When widget.js runs, an error message letting you know which assignment has an incorrectly formatted date will be printed to the console

ADDING NEW ASSIGNMENT TYPES
---------------------------
Each assignment type (e.g. assignment, quiz) has its own icon
To add a new assignment type:
    1. Open widget.js and scroll down to the "Upcoming Due Dates Section" section
    2. Underneath the "Upcoming Due Dates Section" header, find the 3-line comment that says "Add new assignment types above this comment"
    3. Create a new line above the comment, and add the following line:
            case "your new assignment type": return "Bootstrap class that specififies the Bootstrap icon to use";
        This specifies the icon shape to use. The colour and background of the icon will be generated automatically.

UPDATING THE WIDGET FOR EACH COURSE
-----------------------------------
Each time the JSON file is updated, the quicklink to the JSON file must be changed
A quicklink must also be added to the course schedule page
