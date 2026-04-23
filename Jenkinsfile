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
                    @echo off
                    set retries=15

                    :loop
                    echo Checking health... attempts remaining: %retries%
                    curl -s -o NUL -w "%%{http_code}" http://localhost:3000/health | findstr "200" >NUL
                    if %errorlevel%==0 (
                        echo Health check passed!
                        exit /b 0
                    )

                    set /a retries-=1
                    if %retries% GTR 0 (
                        ping -n 5 127.0.0.1 >NUL
                        goto loop
                    )

                    echo Health check failed after all retries.
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