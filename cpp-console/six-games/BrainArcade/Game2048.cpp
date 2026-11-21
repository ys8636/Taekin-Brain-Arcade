
#include <iostream>
#include <cstdlib>
#include <string>
#include <iomanip>
#include <vector>

#include "Game2048.h"

using namespace std;

const int SIZE = 4; // 게임판 크기

int best2048Score = 0; // 프로그램 실행 중 최고 점수

// 2048의 이전 게임 상태 저장용 구조체
struct Game2048State
{
    int board[SIZE][SIZE]; // 이전 게임판
    int score;             // 이전 점수
};


// 2048 게임 규칙 출력
void show2048Rules()
{
    cout << "\n====================================" << endl;
    cout << "             2048 GAME             " << endl;
    cout << "====================================" << endl;

    cout << "\n[게임 소개]" << endl;
    cout << "같은 숫자를 합쳐 2048을 만드는 퍼즐입니다." << endl;

    cout << "\n[게임 규칙]" << endl;
    cout << "1. 게임판은 4×4 크기입니다." << endl;
    cout << "2. 같은 숫자가 만나면 하나로 합쳐집니다." << endl;
    cout << "3. 블록을 이동하면 새 블록이 생성됩니다." << endl;
    cout << "4. 합쳐진 숫자만큼 점수를 얻습니다." << endl;
    cout << "5. 숫자 2048을 만들면 승리합니다." << endl;
    cout << "6. 더 이상 움직일 수 없으면 게임 오버입니다." << endl;

    cout << "\n[조작 방법]" << endl;
    cout << "W : 위쪽으로 이동" << endl;
    cout << "A : 왼쪽으로 이동" << endl;
    cout << "S : 아래쪽으로 이동" << endl;
    cout << "D : 오른쪽으로 이동" << endl;
    cout << "0 : 게임 종료" << endl;

    cout << "\n[합치기 예시]" << endl;
    cout << "2 2 0 0 -> 4 0 0 0" << endl;
    cout << "2 2 2 2 -> 4 4 0 0" << endl;
    cout << "2 2 4 0 -> 4 4 0 0" << endl;

    cout << "\n====================================" << endl;
}

// 게임판 모든 칸을 0으로 초기화
void initializeBoard(int board[SIZE][SIZE])
{
    for (int i = 0; i < SIZE; i++)
    {
        for (int j = 0; j < SIZE; j++)
        {
            board[i][j] = 0;
        }
    }
}

// 빈칸 중 하나에 새로운 블록 생성
void addRandomTile(int board[SIZE][SIZE])
{
    int emptyRows[SIZE * SIZE];
    int emptyCols[SIZE * SIZE];
    int emptyCount = 0;

    // 빈칸 위치 저장
    for (int i = 0; i < SIZE; i++)
    {
        for (int j = 0; j < SIZE; j++)
        {
            if (board[i][j] == 0)
            {
                emptyRows[emptyCount] = i;
                emptyCols[emptyCount] = j;
                emptyCount++;
            }
        }
    }

    // 빈칸이 없으면 생성하지 않음
    if (emptyCount == 0)
    {
        return;
    }

    // 빈칸 중 무작위 위치 선택
    int index = rand() % emptyCount;
    int row = emptyRows[index];
    int col = emptyCols[index];

    // 90% 확률로 2, 10% 확률로 4 생성
    if (rand() % 10 == 0)
    {
        board[row][col] = 4;
    }
    else
    {
        board[row][col] = 2;
    }
}


// 2048 게임판과 점수 출력
void showBoard(int board[SIZE][SIZE], int score)
{
    cout << "\n====================================" << endl;
    cout << "              2048                 " << endl;
    cout << "====================================" << endl;

    cout << "현재 점수: " << score << endl;
    cout << "최고 점수: " << best2048Score << endl;

    cout << "+------+------+------+------+" << endl;

    for (int i = 0; i < SIZE; i++)
    {
        cout << "|";

        for (int j = 0; j < SIZE; j++)
        {
            if (board[i][j] == 0)
            {
                cout << setw(6) << "." << "|";
            }
            else
            {
                cout << setw(6) << board[i][j] << "|";
            }
        }

        cout << endl;
        cout << "+------+------+------+------+" << endl;
    }
}


// 한 줄의 숫자를 왼쪽으로 밀고 같은 숫자를 합침
void mergeLine(int line[SIZE], int& score)
{
    int temp[SIZE] = { 0, 0, 0, 0 };
    int count = 0;

    // 1단계: 0을 제외한 숫자만 앞으로 모으기
    for (int i = 0; i < SIZE; i++)
    {
        if (line[i] != 0)
        {
            temp[count] = line[i];
            count++;
        }
    }

    // 2단계: 서로 붙어 있는 같은 숫자 합치기
    for (int i = 0; i < SIZE - 1; i++)
    {
        if (temp[i] != 0 && temp[i] == temp[i + 1])
        {
            temp[i] = temp[i] * 2;
            score = score + temp[i];

            // 합쳐진 뒤의 숫자를 한 칸씩 당기기
            for (int j = i + 1; j < SIZE - 1; j++)
            {
                temp[j] = temp[j + 1];
            }

            temp[SIZE - 1] = 0;
        }
    }

    // 3단계: 계산한 결과를 원래 배열에 저장
    for (int i = 0; i < SIZE; i++)
    {
        line[i] = temp[i];
    }
}

// 방향에 따라 게임판 이동
bool moveBoard(int board[SIZE][SIZE], char direction, int& score)
{
    bool moved = false;

    // 한 행 또는 열씩 처리
    for (int i = 0; i < SIZE; i++)
    {
        int line[SIZE];

        // 이동 방향에 맞게 숫자 4개 가져오기
        for (int j = 0; j < SIZE; j++)
        {
            if (direction == 'A')
            {
                line[j] = board[i][j];
            }
            else if (direction == 'D')
            {
                line[j] = board[i][SIZE - 1 - j];
            }
            else if (direction == 'W')
            {
                line[j] = board[j][i];
            }
            else
            {
                line[j] = board[SIZE - 1 - j][i];
            }
        }

        // 이동 전 숫자 저장
        int oldLine[SIZE];

        for (int j = 0; j < SIZE; j++)
        {
            oldLine[j] = line[j];
        }

        // 숫자 이동 및 합치기
        mergeLine(line, score);

        // 이동 전후 비교
        for (int j = 0; j < SIZE; j++)
        {
            if (oldLine[j] != line[j])
            {
                moved = true;
            }
        }

        // 이동 결과를 게임판에 반영
        for (int j = 0; j < SIZE; j++)
        {
            if (direction == 'A')
            {
                board[i][j] = line[j];
            }
            else if (direction == 'D')
            {
                board[i][SIZE - 1 - j] = line[j];
            }
            else if (direction == 'W')
            {
                board[j][i] = line[j];
            }
            else
            {
                board[SIZE - 1 - j][i] = line[j];
            }
        }
    }

    return moved;
}

// 2048 블록이 있는지 확인
bool checkWin(int board[SIZE][SIZE])
{
    for (int i = 0; i < SIZE; i++)
    {
        for (int j = 0; j < SIZE; j++)
        {
            if (board[i][j] >= 2048)
            {
                return true;
            }
        }
    }

    return false;
}

// 더 이상 이동할 수 없는지 확인
bool checkGameOver(int board[SIZE][SIZE])
{
    for (int i = 0; i < SIZE; i++)
    {
        for (int j = 0; j < SIZE; j++)
        {
            // 빈칸이 있으면 아직 이동 가능
            if (board[i][j] == 0)
            {
                return false;
            }

            // 오른쪽 숫자와 합칠 수 있는지 확인
            if (j < SIZE - 1 &&
                board[i][j] == board[i][j + 1])
            {
                return false;
            }

            // 아래쪽 숫자와 합칠 수 있는지 확인
            if (i < SIZE - 1 &&
                board[i][j] == board[i + 1][j])
            {
                return false;
            }
        }
    }

    return true; // 빈칸도 없고 합칠 숫자도 없음
}



// 2048 게임 한 판 실행
void start2048Game()
{
    int board[SIZE][SIZE];
    int score = 0;
    string input;

    // 이전 게임 상태를 저장하는 기록 목록
    vector<Game2048State> history;

    initializeBoard(board);

    // 시작할 때 숫자 블록 2개 생성
    addRandomTile(board);
    addRandomTile(board);

    while (true)
    {
        showBoard(board, score);

        // 승리 판정
        if (checkWin(board))
        {
            cout << "\n축하합니다! 2048을 만들었습니다!" << endl;
            cout << "최종 점수: " << score << endl;
            break;
        }

        // 게임 오버 판정
        if (checkGameOver(board))
        {
            cout << "\nGAME OVER!" << endl;
            cout << "더 이상 움직일 수 없습니다." << endl;
            cout << "최종 점수: " << score << endl;
            break;
        }

        cout << "\n[조작 방법]" << endl;
        cout << "W : 위로 이동" << endl;
        cout << "A : 왼쪽으로 이동" << endl;
        cout << "S : 아래로 이동" << endl;
        cout << "D : 오른쪽으로 이동" << endl;
        cout << "U : 이전 이동 되돌리기" << endl;
        cout << "0 : 게임 종료" << endl;

        cout << "\n저장된 이동 기록: "
            << history.size() << "개" << endl;

        cout << "명령 입력: ";

        if (!(cin >> input))
        {
            cout << "\n입력이 종료되어 게임을 마칩니다." << endl;
            return;
        }

        // 게임 중도 종료
        if (input == "0")
        {
            cout << "2048 게임을 종료합니다." << endl;
            return;
        }

        // 한 글자 명령만 허용
        if (input.length() != 1)
        {
            cout << "올바른 명령을 입력해 주세요." << endl;
            continue;
        }

        char direction = input[0];

        // 소문자 입력도 허용
        if (direction >= 'a' && direction <= 'z')
        {
            direction = direction - 'a' + 'A';
        }

        // 무제한 되돌리기
        if (direction == 'U')
        {
            // 저장된 이동 기록이 없으면 되돌리기 불가능
            if (history.empty())
            {
                cout << "더 이상 되돌릴 수 없습니다." << endl;
                continue;
            }

            // 가장 최근 게임 상태 가져오기
            Game2048State previous = history.back();

            // 이전 게임판 복원
            for (int i = 0; i < SIZE; i++)
            {
                for (int j = 0; j < SIZE; j++)
                {
                    board[i][j] = previous.board[i][j];
                }
            }

            // 이전 점수 복원
            score = previous.score;

            // 방금 복원한 기록 제거
            history.pop_back();

            cout << "\n이전 이동으로 되돌렸습니다!" << endl;
            cout << "남은 이동 기록: "
                << history.size() << "개" << endl;

            continue;
        }

        // 이동 방향 검사
        if (direction != 'W' && direction != 'A' &&
            direction != 'S' && direction != 'D')
        {
            cout << "W, A, S, D 또는 U를 입력하세요." << endl;
            continue;
        }

        // 이동 전 게임 상태 저장
        Game2048State current;

        current.score = score;

        for (int i = 0; i < SIZE; i++)
        {
            for (int j = 0; j < SIZE; j++)
            {
                current.board[i][j] = board[i][j];
            }
        }

        // 실제 블록 이동
        bool moved = moveBoard(board, direction, score);

        if (moved)
        {
            // 이동 전 상태를 기록에 추가
            history.push_back(current);

            // 이동 성공 시 새 블록 생성
            addRandomTile(board);

            // 최고 점수 갱신
            if (score > best2048Score)
            {
                best2048Score = score;

                cout << "\n새로운 최고 점수를 달성했습니다!"
                    << endl;
            }
        }
        else
        {
            cout << "해당 방향으로 이동할 수 없습니다." << endl;
        }
    }
}



// 규칙 설명, 시작, 다시 플레이를 관리하는 함수
void play2048()
{
    string choice;

    show2048Rules();

    while (true)
    {
        cout << "\n[1] 게임 시작 / 다시 플레이" << endl;
        cout << "[2] 게임 규칙 다시 보기" << endl;
        cout << "[0] 메인 메뉴로 돌아가기" << endl;
        cout << "선택: ";

        if (!(cin >> choice))
        {
            return;
        }

        if (choice == "1")
        {
            start2048Game();
        }
        else if (choice == "2")
        {
            show2048Rules();
        }
        else if (choice == "0")
        {
            cout << "메인 메뉴로 돌아갑니다." << endl;
            return;
        }
        else
        {
            cout << "0, 1, 2 중에서 선택해 주세요." << endl;
        }
    }
}
