
#include <iostream>
#include <cstdlib>
#include <string>
#include <limits>
#include <vector>

#include "NumberBaseball.h"

using namespace std;

// 숫자야구 규칙 설명 함수
void showBaseballRules()
{
    cout << "\n========================================" << endl;
    cout << "           숫자야구 게임 (4자리)         " << endl;
    cout << "========================================" << endl;

    cout << "\n[게임 소개]" << endl;
    cout << "컴퓨터가 생성한 4자리 숫자를 맞히는 추리 게임입니다." << endl;
    cout << "스트라이크와 볼을 이용하여 정답을 찾아보세요!" << endl;

    cout << "\n[게임 규칙]" << endl;
    cout << "1. 컴퓨터는 0~9 사이의 서로 다른 숫자 4개를 생성합니다." << endl;
    cout << "2. 플레이어는 숫자 4개를 입력합니다." << endl;
    cout << "3. 컴퓨터가 스트라이크와 볼을 계산합니다." << endl;
    cout << "4. 숫자는 중복해서 입력할 수 없습니다." << endl;

    cout << "\n[판정 방법]" << endl;
    cout << "스트라이크(S): 숫자와 위치가 모두 일치" << endl;
    cout << "볼(B): 숫자는 같지만 위치가 다름" << endl;
    cout << "아웃(OUT): 일치하는 숫자가 없음" << endl;

    cout << "\n[판정 예시]" << endl;
    cout << "컴퓨터 정답이 5279일 경우" << endl;
    cout << "입력 1234 -> 1 스트라이크 0 볼" << endl;
    cout << "입력 5729 -> 2 스트라이크 2 볼" << endl;
    cout << "입력 8643 -> OUT" << endl;
    cout << "입력 5279 -> 4 스트라이크! 정답!" << endl;

    cout << "\n[게임 목표]" << endl;
    cout << "최대한 적은 횟수로 4 스트라이크를 달성하세요!" << endl;

    cout << "\n========================================" << endl;
}

// 중복되지 않는 정답 숫자 4개 생성
void createAnswer(int answer[])
{
    int count = 0;

    while (count < 4)
    {
        int number = rand() % 10; // 0~9 사이 난수 생성
        bool duplicate = false;

        // 이전에 생성한 숫자와 중복되는지 확인
        for (int i = 0; i < count; i++)
        {
            if (answer[i] == number)
            {
                duplicate = true;
                break;
            }
        }

        // 중복되지 않은 숫자만 저장
        if (duplicate == false)
        {
            answer[count] = number;
            count++;
        }
    }
}

// 사용자가 입력한 숫자 검사
bool isValidGuess(string guess)
{
    // 반드시 4자리여야 함
    if (guess.length() != 4)
    {
        return false;
    }

    for (int i = 0; i < 4; i++)
    {
        // 0~9 사이 숫자인지 확인
        if (guess[i] < '0' || guess[i] > '9')
        {
            return false;
        }

        // 중복된 숫자가 있는지 확인
        for (int j = 0; j < i; j++)
        {
            if (guess[i] == guess[j])
            {
                return false;
            }
        }
    }

    return true;
}

// 스트라이크와 볼 계산
void checkAnswer(int answer[], string guess, int& strike, int& ball)
{
    strike = 0;
    ball = 0;

    for (int i = 0; i < 4; i++)
    {
        int number = guess[i] - '0'; // 문자를 숫자로 변환

        for (int j = 0; j < 4; j++)
        {
            if (number == answer[j])
            {
                if (i == j)
                {
                    strike++; // 숫자와 위치가 모두 같음
                }
                else
                {
                    ball++; // 숫자는 같지만 위치가 다름
                }
            }
        }
    }
}

// 숫자야구 추리 기록을 저장하는 구조체
struct BaseballRecord
{
    string guess; // 입력한 숫자
    int strike;   // 스트라이크 개수
    int ball;     // 볼 개수
};

// 지금까지의 추리 기록 출력
void showBaseballHistory(const vector<BaseballRecord>& records)
{
    cout << "\n====================================" << endl;
    cout << "           숫자야구 추리 기록        " << endl;
    cout << "====================================" << endl;

    if (records.empty())
    {
        cout << "아직 입력한 기록이 없습니다." << endl;
    }
    else
    {
        cout << "시도\t입력\t결과" << endl;
        cout << "------------------------------------" << endl;

        for (int i = 0; i < static_cast<int>(records.size()); i++)
        {
            cout << i + 1 << "\t"
                << records[i].guess << "\t"
                << records[i].strike << "S "
                << records[i].ball << "B" << endl;
        }
    }

    cout << "====================================" << endl;
}

// 실제 숫자야구 한 판 진행

// 실제 숫자야구 한 판 진행
void startBaseballGame()
{
    int answer[4]; // 정답 숫자 4개
    int attempts = 0;
    string guess;

    // 추리 기록을 저장하는 vector
    vector<BaseballRecord> records;

    createAnswer(answer); // 무작위 정답 생성

    cout << "\n========== GAME START ==========" << endl;
    cout << "4자리 숫자야구를 시작합니다!" << endl;
    cout << "0~9 사이의 서로 다른 숫자 4개를 입력하세요." << endl;
    cout << "0 하나만 입력하면 게임을 종료합니다." << endl;

    while (true)
    {
        // 지금까지의 입력 기록 출력
        showBaseballHistory(records);

        cout << "\n숫자 입력: ";

        if (!(cin >> guess))
        {
            cout << "\n입력이 종료되어 게임을 마칩니다." << endl;
            return;
        }

        // 게임 중도 종료
        if (guess == "0")
        {
            cout << "게임을 중도 종료합니다." << endl;
            return;
        }

        // 입력값 유효성 검사
        if (!isValidGuess(guess))
        {
            cout << "잘못된 입력입니다!" << endl;
            cout << "0~9 사이의 중복 없는 숫자 4개를 입력하세요."
                << endl;
            continue;
        }

        // 이전에 입력한 숫자인지 검사
        bool alreadyGuessed = false;

        for (int i = 0; i < static_cast<int>(records.size()); i++)
        {
            if (records[i].guess == guess)
            {
                alreadyGuessed = true;
                break;
            }
        }

        if (alreadyGuessed)
        {
            cout << "\n이미 입력했던 숫자입니다!" << endl;
            cout << "다른 숫자를 입력해 주세요." << endl;
            continue;
        }

        // 새로운 정상 입력만 시도 횟수에 포함
        attempts++;

        int strike = 0;
        int ball = 0;

        // 스트라이크와 볼 계산
        checkAnswer(answer, guess, strike, ball);

        // 새로운 추리 기록 저장
        BaseballRecord record;

        record.guess = guess;
        record.strike = strike;
        record.ball = ball;

        records.push_back(record);

        // 현재 입력 결과 출력
        if (strike == 0 && ball == 0)
        {
            cout << "\nOUT!" << endl;
        }
        else
        {
            cout << "\n" << strike << " 스트라이크 "
                << ball << " 볼" << endl;
        }

        // 4 스트라이크면 승리
        if (strike == 4)
        {
            showBaseballHistory(records);

            cout << "\n================================" << endl;
            cout << "          GAME CLEAR!           " << endl;
            cout << "================================" << endl;

            cout << "축하합니다! 정답을 맞혔습니다!" << endl;
            cout << "정답: " << guess << endl;
            cout << "총 시도 횟수: " << attempts << endl;

            return;
        }
    }
}


// 숫자야구 메인 실행 함수
void playNumberBaseball()
{
    int choice;

    while (true)
    {
        showBaseballRules(); // 게임 규칙 출력

        cout << "\n[1] 게임 시작" << endl;
        cout << "[0] 메인 메뉴로 돌아가기" << endl;
        cout << "선택: ";

        if (!(cin >> choice))
        {
            if (cin.eof())
            {
                return;
            }

            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');

            cout << "숫자만 입력해 주세요!" << endl;
            continue;
        }

        if (choice == 1)
        {
            startBaseballGame(); // 게임 실행

            cout << "\n[1] 다시 플레이" << endl;
            cout << "[0] 메인 메뉴로 돌아가기" << endl;
            cout << "선택: ";

            if (!(cin >> choice))
            {
                if (cin.eof())
                {
                    return;
                }

                cin.clear();
                cin.ignore(numeric_limits<streamsize>::max(), '\n');

                cout << "잘못된 입력입니다. 메인 메뉴로 돌아갑니다." << endl;
                return;
            }

            if (choice == 1)
            {
                continue;
            }
            else
            {
                return;
            }
        }
        else if (choice == 0)
        {
            return;
        }
        else
        {
            cout << "0 또는 1을 입력해 주세요!" << endl;
        }
    }
}
