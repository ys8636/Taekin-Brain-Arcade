
#include <iostream>
#include <string>
#include <sstream>
#include <cstdlib>

#include "Shikaku.h"

using namespace std;

const int MAX_SIZE = 7;
const int MAX_REGIONS = 49;

// 직사각형 위치를 저장하는 구조체
struct Rectangle
{
    int r1, c1;
    int r2, c2;
};

// 숫자 힌트가 들어 있는 문제판
int clues[MAX_SIZE][MAX_SIZE];

// 사용자가 선택한 영역
char regions[MAX_SIZE][MAX_SIZE];

// 문제 생성 시 사용할 정답 영역 목록
Rectangle solution[MAX_REGIONS];

// 사용자가 선택한 직사각형 기록
Rectangle history[MAX_REGIONS];

// 현재 게임 설정
int boardSize = 5;
int targetRegions = 6;
int solutionCount = 0;
int regionCount = 0;

// 게임판 초기화
void initializeShikaku()
{
    for (int i = 0; i < MAX_SIZE; i++)
    {
        for (int j = 0; j < MAX_SIZE; j++)
        {
            clues[i][j] = 0;
            regions[i][j] = '.';
        }
    }

    solutionCount = 0;
    regionCount = 0;
}

// 직사각형 넓이 계산
int getRectangleArea(Rectangle rect)
{
    int height = rect.r2 - rect.r1 + 1;
    int width = rect.c2 - rect.c1 + 1;

    return height * width;
}


void showShikakuRules()
{
    cout << "\n====================================" << endl;
    cout << "              SHIKAKU              " << endl;
    cout << "====================================" << endl;

    cout << "\n[게임 소개]" << endl;
    cout << "숫자에 맞게 게임판을 직사각형으로 나누는 게임입니다." << endl;
    cout << "논리력과 공간지각력을 활용하여 퍼즐을 완성하세요!" << endl;

    cout << "\n[게임 규칙]" << endl;
    cout << "1. 모든 칸을 직사각형으로 나누어야 합니다." << endl;
    cout << "2. 각 직사각형에는 숫자가 정확히 하나 있어야 합니다." << endl;
    cout << "3. 직사각형의 넓이는 내부의 숫자와 같아야 합니다." << endl;
    cout << "4. 직사각형끼리는 서로 겹칠 수 없습니다." << endl;
    cout << "5. 모든 칸을 올바르게 채우면 승리합니다." << endl;

    cout << "\n[난이도 선택]" << endl;
    cout << "1. 쉬움   : 5×5 게임판 / 직사각형 6개" << endl;
    cout << "2. 보통   : 6×6 게임판 / 직사각형 9개" << endl;
    cout << "3. 어려움 : 7×7 게임판 / 직사각형 12개" << endl;
    cout << "※ 게임을 시작할 때마다 새로운 문제가 생성됩니다." << endl;

    cout << "\n[조작 방법]" << endl;
    cout << "R 시작행 시작열 끝행 끝열 : 직사각형 만들기" << endl;
    cout << "U : 마지막 직사각형 취소" << endl;
    cout << "H : 힌트 보기" << endl;
    cout << "0 : 게임 종료" << endl;

    cout << "\n[직사각형 입력 예시]" << endl;
    cout << "R 1 1 2 2" << endl;
    cout << "-> 1행 1열부터 2행 2열까지 선택" << endl;
    cout << "-> 가로 2칸 × 세로 2칸 = 넓이 4" << endl;
    cout << "-> 영역 안에 숫자 4가 하나 있으면 정답" << endl;

    cout << "\n[힌트 기능]" << endl;
    cout << "1. 게임 도중 H를 입력하면 힌트를 확인할 수 있습니다." << endl;
    cout << "2. 아직 선택하지 않은 정답 영역의 좌표를 알려줍니다." << endl;
    cout << "3. 힌트를 확인해도 영역이 자동으로 선택되지는 않습니다." << endl;
    cout << "4. 알려준 좌표를 R 명령으로 직접 입력해야 합니다." << endl;
    cout << "5. 게임 종료 시 힌트 사용 횟수를 확인할 수 있습니다." << endl;
    cout << "※ 기존 선택 영역과 겹치는 힌트는 제공되지 않습니다." << endl;

    cout << "\n[게임판 표시]" << endl;
    cout << ". : 아직 선택하지 않은 칸" << endl;
    cout << "숫자 : 직사각형의 넓이를 나타내는 힌트" << endl;
    cout << "A~Y : 사용자가 완성한 직사각형 영역" << endl;

    cout << "\n[승리 조건]" << endl;
    cout << "모든 칸을 올바른 직사각형으로 채우면 승리합니다!" << endl;
    cout << "힌트를 적게 사용하면서 퍼즐을 완성해 보세요." << endl;

    cout << "\n====================================" << endl;
}


// 난이도 설정
void setShikakuDifficulty(int difficulty)
{
    if (difficulty == 1)
    {
        boardSize = 5;
        targetRegions = 6;
    }
    else if (difficulty == 2)
    {
        boardSize = 6;
        targetRegions = 9;
    }
    else
    {
        boardSize = 7;
        targetRegions = 12;
    }
}


// 직사각형을 분할할 수 있는지 검사
bool canSplitRectangle(Rectangle rect)
{
    int height = rect.r2 - rect.r1 + 1;
    int width = rect.c2 - rect.c1 + 1;

    // 가로 또는 세로가 2칸 이상이면 분할 가능
    return height >= 2 || width >= 2;
}

// 직사각형 하나를 무작위로 두 개로 분할
void splitRectangle(int index)
{
    Rectangle original = solution[index];

    int height = original.r2 - original.r1 + 1;
    int width = original.c2 - original.c1 + 1;

    bool splitHorizontal;

    if (height < 2)
    {
        splitHorizontal = false;
    }
    else if (width < 2)
    {
        splitHorizontal = true;
    }
    else
    {
        splitHorizontal = (rand() % 2 == 0);
    }

    Rectangle first = original;
    Rectangle second = original;

    if (splitHorizontal)
    {
        int cut = 1 + rand() % (height - 1);

        first.r2 = original.r1 + cut - 1;
        second.r1 = original.r1 + cut;
    }
    else
    {
        int cut = 1 + rand() % (width - 1);

        first.c2 = original.c1 + cut - 1;
        second.c1 = original.c1 + cut;
    }

    solution[index] = first;
    solution[solutionCount] = second;

    solutionCount++;
}


// 무작위 시카쿠 문제 생성
void generateShikakuPuzzle()
{
    initializeShikaku();

    // 처음에는 게임판 전체가 하나의 직사각형
    solution[0] = { 0, 0, boardSize - 1, boardSize - 1 };
    solutionCount = 1;

    // 목표 영역 수까지 직사각형 분할
    while (solutionCount < targetRegions)
    {
        int candidates[MAX_REGIONS];
        int candidateCount = 0;

        // 분할할 수 있는 영역 찾기
        for (int i = 0; i < solutionCount; i++)
        {
            if (canSplitRectangle(solution[i]))
            {
                candidates[candidateCount] = i;
                candidateCount++;
            }
        }

        if (candidateCount == 0)
        {
            break;
        }

        // 분할 가능한 영역 중 무작위 선택
        int randomIndex = rand() % candidateCount;
        int selected = candidates[randomIndex];

        splitRectangle(selected);
    }

    // 각 직사각형에 넓이를 나타내는 숫자 하나 배치
    for (int i = 0; i < solutionCount; i++)
    {
        Rectangle rect = solution[i];

        int height = rect.r2 - rect.r1 + 1;
        int width = rect.c2 - rect.c1 + 1;

        // 영역 내부의 임의 위치 선택
        int row = rect.r1 + rand() % height;
        int col = rect.c1 + rand() % width;

        clues[row][col] = getRectangleArea(rect);
    }
}

// 현재 게임판 출력
void showShikakuBoard()
{
    cout << "\n====================================" << endl;
    cout << "              SHIKAKU              " << endl;
    cout << "====================================" << endl;

    cout << "게임판: " << boardSize << "×" << boardSize << endl;
    cout << "완성한 직사각형: " << regionCount << endl;

    cout << "\n     ";

    for (int i = 1; i <= boardSize; i++)
    {
        cout << i << "   ";
    }

    cout << "\n   ";

    for (int i = 0; i < boardSize; i++)
    {
        cout << "----";
    }

    cout << endl;

    for (int i = 0; i < boardSize; i++)
    {
        cout << " " << i + 1 << " | ";

        for (int j = 0; j < boardSize; j++)
        {
            if (regions[i][j] != '.')
            {
                cout << regions[i][j] << "   ";
            }
            else if (clues[i][j] != 0)
            {
                cout << clues[i][j] << "   ";
            }
            else
            {
                cout << ".   ";
            }
        }

        cout << endl;
    }
}

// 사용자가 선택한 직사각형 검사
bool isValidRectangle(Rectangle rect)
{
    // 좌표 범위 검사
    if (rect.r1 < 0 || rect.r2 >= boardSize ||
        rect.c1 < 0 || rect.c2 >= boardSize ||
        rect.r2 < 0 || rect.c2 < 0 ||
        rect.r1 >= boardSize || rect.c1 >= boardSize)
    {
        cout << "좌표가 게임판 범위를 벗어났습니다." << endl;
        return false;
    }

    if (rect.r1 > rect.r2 || rect.c1 > rect.c2)
    {
        cout << "시작 좌표와 끝 좌표를 확인하세요." << endl;
        return false;
    }

    int area = getRectangleArea(rect);
    int clueCount = 0;
    int clueValue = 0;

    for (int i = rect.r1; i <= rect.r2; i++)
    {
        for (int j = rect.c1; j <= rect.c2; j++)
        {
            // 기존 영역과 겹치는지 검사
            if (regions[i][j] != '.')
            {
                cout << "이미 선택한 영역과 겹칩니다." << endl;
                return false;
            }

            // 숫자 개수 확인
            if (clues[i][j] != 0)
            {
                clueCount++;
                clueValue = clues[i][j];
            }
        }
    }

    if (clueCount != 1)
    {
        cout << "직사각형에는 숫자가 정확히 하나 있어야 합니다."
            << endl;
        return false;
    }

    if (area != clueValue)
    {
        cout << "넓이가 숫자와 일치하지 않습니다." << endl;
        cout << "선택한 넓이: " << area << endl;
        cout << "필요한 넓이: " << clueValue << endl;
        return false;
    }

    return true;
}

// 직사각형 영역 표시
void addShikakuRectangle(Rectangle rect, char symbol)
{
    for (int i = rect.r1; i <= rect.r2; i++)
    {
        for (int j = rect.c1; j <= rect.c2; j++)
        {
            regions[i][j] = symbol;
        }
    }
}

// 마지막 직사각형 취소
void undoShikakuRectangle()
{
    if (regionCount == 0)
    {
        cout << "되돌릴 직사각형이 없습니다." << endl;
        return;
    }

    regionCount--;

    Rectangle rect = history[regionCount];

    for (int i = rect.r1; i <= rect.r2; i++)
    {
        for (int j = rect.c1; j <= rect.c2; j++)
        {
            regions[i][j] = '.';
        }
    }

    cout << "마지막 직사각형을 취소했습니다." << endl;
}

// 모든 칸이 채워졌는지 확인
bool checkShikakuWin()
{
    for (int i = 0; i < boardSize; i++)
    {
        for (int j = 0; j < boardSize; j++)
        {
            if (regions[i][j] == '.')
            {
                return false;
            }
        }
    }

    return true;
}


// 시카쿠 힌트 제공 함수
bool showShikakuHint(int& hintCount)
{
    // 컴퓨터가 생성한 정답 영역을 하나씩 확인
    for (int k = 0; k < solutionCount; k++)
    {
        Rectangle rect = solution[k];

        bool available = true;

        // 해당 영역이 이미 선택되었는지 검사
        for (int i = rect.r1; i <= rect.r2; i++)
        {
            for (int j = rect.c1; j <= rect.c2; j++)
            {
                if (regions[i][j] != '.')
                {
                    available = false;
                    break;
                }
            }

            if (!available)
            {
                break;
            }
        }

        // 아직 선택되지 않은 정답 영역 발견
        if (available)
        {
            hintCount++;

            cout << "\n====================================" << endl;
            cout << "               HINT                 " << endl;
            cout << "====================================" << endl;

            cout << "추천 직사각형 좌표" << endl;

            // 배열 인덱스는 0부터 시작하므로 1을 더함
            cout << "시작: "
                << rect.r1 + 1 << "행 "
                << rect.c1 + 1 << "열" << endl;

            cout << "끝: "
                << rect.r2 + 1 << "행 "
                << rect.c2 + 1 << "열" << endl;

            cout << "넓이: "
                << getRectangleArea(rect) << endl;

            cout << "\n입력할 명령:" << endl;
            cout << "R "
                << rect.r1 + 1 << " "
                << rect.c1 + 1 << " "
                << rect.r2 + 1 << " "
                << rect.c2 + 1 << endl;

            cout << "\n힌트 사용 횟수: "
                << hintCount << endl;

            cout << "====================================" << endl;

            return true;
        }
    }

    cout << "\n현재 선택 상태에서 제공할 수 있는"
        << " 힌트가 없습니다." << endl;
    cout << "마지막 영역을 되돌리거나 다른 영역을 확인해 보세요."
        << endl;

    return false;
}

// 시카쿠 게임 한 판 실행
void startShikakuGame()
{
    generateShikakuPuzzle();

    int hintCount = 0; // 이번 게임에서 사용한 힌트 횟수

    cout << "\n새로운 시카쿠 문제가 생성되었습니다!" << endl;

    while (true)
    {
        showShikakuBoard();

        cout << "\n명령 (R 행 열 행 열 / U / H / 0): ";

        string line;

        if (!getline(cin, line))
        {
            cout << "입력이 종료되어 게임을 마칩니다." << endl;
            return;
        }

        if (line == "0")
        {
            cout << "시카쿠 게임을 종료합니다." << endl;
            return;
        }

        stringstream ss(line);
        char command;

        if (!(ss >> command))
        {
            cout << "명령을 입력해 주세요." << endl;
            continue;
        }

        // 소문자 명령도 허용
        if (command >= 'a' && command <= 'z')
        {
            command = command - 'a' + 'A';
        }

        if (command == 'U')
        {
            string extra;

            if (ss >> extra)
            {
                cout << "U만 입력해 주세요." << endl;
                continue;
            }

            undoShikakuRectangle();
            continue;
        }


        // 힌트 요청
        if (command == 'H')
        {
            string extra;

            if (ss >> extra)
            {
                cout << "H만 입력해 주세요." << endl;
                continue;
            }

            showShikakuHint(hintCount);
            continue;
        }

        // 직사각형 생성 명령인지 확인
        if (command != 'R')
        {
            cout << "R, U, H 또는 0을 입력하세요." << endl;
            continue;
        }


        Rectangle rect;
        string extra;

        if (!(ss >> rect.r1 >> rect.c1 >>
            rect.r2 >> rect.c2) || (ss >> extra))
        {
            cout << "예: R 1 1 2 2" << endl;
            continue;
        }

        // 입력 좌표를 배열 인덱스로 변환
        rect.r1--;
        rect.c1--;
        rect.r2--;
        rect.c2--;

        if (!isValidRectangle(rect))
        {
            continue;
        }

        history[regionCount] = rect;

        // 영역을 알파벳으로 표시
        char symbol = 'A' + regionCount;

        addShikakuRectangle(rect, symbol);
        regionCount++;

        cout << "올바른 직사각형입니다!" << endl;

        if (checkShikakuWin())
        {
            showShikakuBoard();

            cout << "\n====================================" << endl;
            cout << "             GAME CLEAR!            " << endl;
            cout << "====================================" << endl;
            cout << "축하합니다! 시카쿠 퍼즐을 완성했습니다!" << endl;
            cout << "완성한 영역 수: " << regionCount << endl;
            cout << "힌트 사용 횟수: " << hintCount << endl;
            return;
        }
    }
}

// 시카쿠 메인 실행 함수
void playShikaku()
{
    string choice;

    showShikakuRules();

    while (true)
    {
        cout << "\n========== 난이도 선택 ==========" << endl;
        cout << "[1] 쉬움   (5×5)" << endl;
        cout << "[2] 보통   (6×6)" << endl;
        cout << "[3] 어려움 (7×7)" << endl;
        cout << "[4] 게임 규칙 다시 보기" << endl;
        cout << "[0] 메인 메뉴로 돌아가기" << endl;
        cout << "선택: ";

        if (!(cin >> choice))
        {
            return;
        }

        if (choice == "1" || choice == "2" || choice == "3")
        {
            int difficulty = choice[0] - '0';

            setShikakuDifficulty(difficulty);

            // cin 다음 getline을 위한 줄바꿈 제거
            cin.ignore(10000, '\n');

            startShikakuGame();
        }
        else if (choice == "4")
        {
            showShikakuRules();
        }
        else if (choice == "0")
        {
            cout << "메인 메뉴로 돌아갑니다." << endl;
            return;
        }
        else
        {
            cout << "0~4 사이에서 선택해 주세요." << endl;
        }
    }
}
