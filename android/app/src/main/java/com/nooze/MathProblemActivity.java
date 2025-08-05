package com.nooze;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import java.util.Random;

public class MathProblemActivity extends Activity {
    private static final String TAG = "MathProblemActivity";
    private static final int TOTAL_QUESTIONS = 4;
    
    private TextView questionText;
    private TextView progressText;
    private EditText answerInput;
    private Button submitButton;
    private Button nextButton;
    
    private int currentQuestion = 0;
    private int correctAnswers = 0;
    private int[] answers = new int[TOTAL_QUESTIONS];
    private String[] questions = new String[TOTAL_QUESTIONS];
    
    private Random random = new Random();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "MathProblemActivity onCreate called");
        setContentView(R.layout.activity_math_problem);
        
        // Initialize UI
        initializeUI();
        
        // Generate all questions
        generateQuestions();
        
        // Show first question
        showQuestion(0);
        
        Log.d(TAG, "MathProblemActivity setup complete");
    }

    private void initializeUI() {
        questionText = findViewById(R.id.question_text);
        progressText = findViewById(R.id.progress_text);
        answerInput = findViewById(R.id.answer_input);
        submitButton = findViewById(R.id.submit_button);
        nextButton = findViewById(R.id.next_button);
        
        // Submit button - check answer
        submitButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                checkAnswer();
            }
        });
        
        // Next button - show next question
        nextButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showNextQuestion();
            }
        });
        
        // Show keyboard when input is focused
        answerInput.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus) {
                    InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                    imm.showSoftInput(answerInput, InputMethodManager.SHOW_IMPLICIT);
                }
            }
        });
    }

    private void generateQuestions() {
        Log.d(TAG, "Generating " + TOTAL_QUESTIONS + " math questions");
        
        for (int i = 0; i < TOTAL_QUESTIONS; i++) {
            // Generate two random numbers between 1 and 50
            int num1 = random.nextInt(50) + 1;
            int num2 = random.nextInt(50) + 1;
            
            // Ensure no negative results (num1 >= num2)
            if (num1 < num2) {
                int temp = num1;
                num1 = num2;
                num2 = temp;
            }
            
            questions[i] = num1 + " + " + num2 + " = ?";
            answers[i] = num1 + num2;
            
            Log.d(TAG, "Question " + (i + 1) + ": " + questions[i] + " Answer: " + answers[i]);
        }
    }

    private void showQuestion(int questionIndex) {
        currentQuestion = questionIndex;
        
        // Update progress
        progressText.setText("Question " + (questionIndex + 1) + " of " + TOTAL_QUESTIONS);
        
        // Show question
        questionText.setText(questions[questionIndex]);
        
        // Clear input
        answerInput.setText("");
        answerInput.setEnabled(true);
        answerInput.requestFocus();
        
        // Show submit button, hide next button
        submitButton.setVisibility(View.VISIBLE);
        nextButton.setVisibility(View.GONE);
        
        Log.d(TAG, "Showing question " + (questionIndex + 1));
    }

    private void checkAnswer() {
        String userAnswer = answerInput.getText().toString().trim();
        
        if (userAnswer.isEmpty()) {
            answerInput.setError("Please enter an answer");
            return;
        }
        
        try {
            int userAnswerInt = Integer.parseInt(userAnswer);
            int correctAnswer = answers[currentQuestion];
            
            if (userAnswerInt == correctAnswer) {
                correctAnswers++;
                Log.d(TAG, "Correct answer! " + userAnswerInt + " = " + correctAnswer);
                
                // Disable input
                answerInput.setEnabled(false);
                
                // Show success message
                questionText.setText("✓ Correct! " + questions[currentQuestion] + " = " + correctAnswer);
                
                // Show next button or finish
                if (currentQuestion < TOTAL_QUESTIONS - 1) {
                    nextButton.setVisibility(View.VISIBLE);
                    submitButton.setVisibility(View.GONE);
                } else {
                    // All questions completed
                    finishMathProblems();
                }
            } else {
                Log.d(TAG, "Wrong answer! User: " + userAnswerInt + ", Correct: " + correctAnswer);
                answerInput.setError("Wrong answer. Try again!");
                answerInput.setText("");
                answerInput.requestFocus();
            }
        } catch (NumberFormatException e) {
            answerInput.setError("Please enter a valid number");
        }
    }

    private void showNextQuestion() {
        showQuestion(currentQuestion + 1);
    }

    private void finishMathProblems() {
        Log.d(TAG, "Math problems completed! Correct answers: " + correctAnswers + "/" + TOTAL_QUESTIONS);
        
        if (correctAnswers == TOTAL_QUESTIONS) {
            // All correct - stop alarm completely
            Log.d(TAG, "All questions correct! Stopping alarm");
            
            // Stop any remaining alarm service
            AlarmService.stopAlarm(this);
            
            // Show completion message
            questionText.setText("🎉 All correct! Alarm stopped.");
            progressText.setText("You can now go back to sleep or start your day!");
            
            // Close activity after a short delay
            questionText.postDelayed(new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            }, 2000);
        } else {
            // Not all correct - restart
            Log.d(TAG, "Not all questions correct. Restarting...");
            restartMathProblems();
        }
    }

    private void restartMathProblems() {
        Log.d(TAG, "Restarting math problems");
        
        // Reset progress
        currentQuestion = 0;
        correctAnswers = 0;
        
        // Generate new questions
        generateQuestions();
        
        // Show first question
        showQuestion(0);
    }

    @Override
    public void onBackPressed() {
        // Prevent back button - user must solve math problems
        Log.d(TAG, "Back button pressed - preventing escape");
    }
} 