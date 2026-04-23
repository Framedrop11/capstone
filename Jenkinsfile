pipeline {
    agent any

    stages {

        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Environment') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build & Deploy') {
            steps {
                bat 'docker-compose down || exit 0'
                bat 'docker-compose up -d --build'
            }
        }

        stage('Health Check') {
            steps {
                bat '''
                set retries=10
                :loop
                curl -f http://localhost:3006/health
                if %errorlevel%==0 exit /b 0
                timeout /t 3 > nul
                set /a retries-=1
                if %retries% GTR 0 goto loop
                exit /b 1
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
