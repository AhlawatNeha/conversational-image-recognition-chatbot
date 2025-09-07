pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/<tumhara-username>/image-recognition-chatbot.git'
            }
        }

        stage('Build') {
            steps {
                echo 'Static HTML/CSS/JS project - no build needed'
            }
        }

        stage('Test') {
            steps {
                echo 'No automated tests yet - skipping'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploy step (yahan actual deployment command aayegi)'
            }
        }
    }
}
