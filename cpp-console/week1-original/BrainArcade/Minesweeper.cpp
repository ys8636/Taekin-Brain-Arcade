
#include <iostream>
#include <cstdlib>
#include <string>
#include <sstream>
#include <iomanip>

#include "Minesweeper.h"

using namespace std;

// 가장 큰 게임판 크기
const int MS_MAX = 10;

// 현재 선택한 난이도 설정
int msSize = 6;
int msMineCount = 6;

// 난이도 선택
void setMinesweeperDifficulty(int difficulty)
{
    if (difficulty == 1)
    {
        msSize = 6;
        msMineCount = 6;
    }
    else if (difficulty == 2)
    {
        msSize = 8;
        msMineCount = 12;
    }
    else
    {
        msSize = 10;
        msMineCount = 20;
    }
}

// 게임 규칙 설명
void showMinesweeperRules()
{
    cout << "\n====================================" << endl;
    cout << "            지뢰찾기 게임            " << endl;
    cout << "====================================" << endl;

    cout << "\n[게임 소개]" << endl;
    cout << "숫자 힌트를 이용하여 지뢰를 피하는 추리 게임입니다." << endl;

    cout << "\n[난이도]" << endl;
    cout << "쉬움   : 6×6 / 지뢰 6개" << endl;
    cout << "보통   : 8×8 / 지뢰 12개" << endl;
    cout << "어려움 : 10×10 / 지뢰 20개" << endl;

    cout << "\n[게임 규칙]" << endl;
    cout << "1. 지뢰가 없는 칸을 모두 열면 승리합니다." << endl;
    cout << "2. 지뢰가 있는 칸을 열면 즉시 패배합니다." << endl;
    cout << "3. 숫자는 주변 8칸의 지뢰 개수입니다." << endl;
    cout << "4. 깃발로 지뢰가 있다고 생각하는 칸을 표시합니다." << endl;
    cout << "5. 첫 클릭 위치와 주변 칸은 안전합니다." << endl;
    cout << "6. 주변 지뢰가 0개인 칸은 자동으로 열립니다." << endl;

    cout << "\n[조작 방법]" << endl;
    cout << "O 행 열 : 칸 열기" << endl;
    cout << "F 행 열 : 깃발 설치 또는 해제" << endl;
    cout << "0       : 게임 종료" << endl;

    cout << "\n[표시 기호]" << endl;
    cout << "# : 닫힌 칸" << endl;
    cout << "F : 깃발" << endl;
    cout << ". : 주변 지뢰 0개" << endl;
    cout << "* : 지뢰 (게임 종료 시 공개)" << endl;

    cout << "\n====================================" << endl;
}

// 게임판 초기화
void initializeMinesweeper(
    bool mines[MS_MAX][MS_MAX],
    bool opened[MS_MAX][MS_MAX],
    bool flags[MS_MAX][MS_MAX])
{
    for (int i = 0; i < MS_MAX; i++)
    {
        for (int j = 0; j < MS_MAX; j++)
        {
            mines[i][j] = false;
            opened[i][j] = false;
            flags[i][j] = false;
        }
    }
}

// 첫 클릭 주변 3×3 영역을 제외하고 지뢰 배치
void placeMines(
    bool mines[MS_MAX][MS_MAX],
    int safeRow, int safeCol)
{
    int count = 0;

    while (count < msMineCount)
    {
        int row = rand() % msSize;
        int col = rand() % msSize;

        // 이미 지뢰가 있으면 다시 뽑기
        if (mines[row][col])
        {
            continue;
        }

        // 첫 클릭 위치 및 주변 8칸 보호
        if (row >= safeRow - 1 && row <= safeRow + 1 &&
            col >= safeCol - 1 && col <= safeCol + 1)
        {
            continue;
        }

        mines[row][col] = true;
        count++;
    }
}

// 주변 지뢰 개수 계산
int countNearbyMines(
    bool mines[MS_MAX][MS_MAX],
    int row, int col)
{
    int count = 0;

    for (int dr = -1; dr <= 1; dr++)
    {
        for (int dc = -1; dc <= 1; dc++)
        {
            if (dr == 0 && dc == 0)
            {
                continue;
            }

            int nr = row + dr;
            int nc = col + dc;

            // 범위를 벗어난 칸은 제외
            if (nr < 0 || nr >= msSize ||
                nc < 0 || nc >= msSize)
            {
                continue;
            }

            if (mines[nr][nc])
            {
                count++;
            }
        }
    }

    return count;
}

// 안전한 칸과 주변 빈칸 자동 열기
void openSafeCells(
    bool mines[MS_MAX][MS_MAX],
    bool opened[MS_MAX][MS_MAX],
    bool flags[MS_MAX][MS_MAX],
    int row, int col)
{
    if (row < 0 || row >= msSize ||
        col < 0 || col >= msSize)
    {
        return;
    }

    // 이미 열었거나 깃발이 있거나 지뢰면 종료
    if (opened[row][col] || flags[row][col] ||
        mines[row][col])
    {
        return;
    }

    opened[row][col] = true;

    // 주변 지뢰가 있으면 더 이상 확장하지 않음
    if (countNearbyMines(mines, row, col) > 0)
    {
        return;
    }

    // 주변 8칸도 안전하면 계속 열기
    for (int dr = -1; dr <= 1; dr++)
    {
        for (int dc = -1; dc <= 1; dc++)
        {
            if (dr == 0 && dc == 0)
            {
                continue;
            }

            openSafeCells(
                mines, opened, flags,
                row + dr, col + dc);
        }
    }
}

// 게임판 출력
void showMinesweeperBoard(
    bool mines[MS_MAX][MS_MAX],
    bool opened[MS_MAX][MS_MAX],
    bool flags[MS_MAX][MS_MAX],
    bool revealMines)
{
    cout << "\n====================================" << endl;
    cout << "             지뢰찾기               " << endl;
    cout << "====================================" << endl;

    cout << "    ";

    for (int j = 1; j <= msSize; j++)
    {
        cout << setw(3) << j;
    }

    cout << "\n   ";

    for (int j = 0; j < msSize; j++)
    {
        cout << "---";
    }

    cout << endl;

    for (int i = 0; i < msSize; i++)
    {
        cout << setw(2) << i + 1 << " |";

        for (int j = 0; j < msSize; j++)
        {
            char symbol = '#';

            if (revealMines && mines[i][j])
            {
                symbol = '*';
            }
            else if (opened[i][j])
            {
                int nearby = countNearbyMines(mines, i, j);

                if (nearby == 0)
                {
                    symbol = '.';
                }
                else
                {
                    symbol = '0' + nearby;
                }
            }
            else if (flags[i][j])
            {
                symbol = 'F';
            }

            cout << setw(3) << symbol;
        }

        cout << endl;
    }
}

// 승리 여부 확인
bool checkMinesweeperWin(
    bool mines[MS_MAX][MS_MAX],
    bool opened[MS_MAX][MS_MAX])
{
    for (int i = 0; i < msSize; i++)
    {
        for (int j = 0; j < msSize; j++)
        {
            // 지뢰가 없는 닫힌 칸이 남아 있으면 미완료
            if (!mines[i][j] && !opened[i][j])
            {
                return false;
            }
        }
    }

    return true;
}

// 현재 깃발 개수 계산
int countFlags(bool flags[MS_MAX][MS_MAX])
{
    int count = 0;

    for (int i = 0; i < msSize; i++)
    {
        for (int j = 0; j < msSize; j++)
        {
            if (flags[i][j])
            {
                count++;
            }
        }
    }

    return count;
}

// 지뢰찾기 한 판 실행
void startMinesweeperGame()
{
    bool mines[MS_MAX][MS_MAX];
    bool opened[MS_MAX][MS_MAX];
    bool flags[MS_MAX][MS_MAX];

    initializeMinesweeper(mines, opened, flags);

    bool firstOpen = true;
    int openCount = 0;

    cout << "\n새로운 지뢰찾기 게임을 시작합니다!" << endl;

    while (true)
    {
        showMinesweeperBoard(mines, opened, flags, false);

        int flagCount = countFlags(flags);

        cout << "\n전체 지뢰: " << msMineCount << "개" << endl;
        cout << "설치한 깃발: " << flagCount << "개" << endl;
        cout << "남은 깃발: " << msMineCount - flagCount << "개" << endl;
        cout << "열기 횟수: " << openCount << endl;

        cout << "\n명령 (O 행 열 / F 행 열 / 0): ";

        string line;

        if (!getline(cin, line))
        {
            cout << "입력이 종료되어 게임을 마칩니다." << endl;
            return;
        }

        if (line == "0")
        {
            cout << "지뢰찾기를 종료합니다." << endl;
            return;
        }

        stringstream ss(line);
        char command;
        int row, col;
        string extra;

        if (!(ss >> command >> row >> col) ||
            (ss >> extra))
        {
            cout << "입력 형식이 잘못되었습니다." << endl;
            cout << "예: O 2 3 또는 F 4 5" << endl;
            continue;
        }

        // 소문자를 대문자로 변환
        if (command >= 'a' && command <= 'z')
        {
            command = command - 'a' + 'A';
        }

        if (command != 'O' && command != 'F')
        {
            cout << "O 또는 F 명령을 입력하세요." << endl;
            continue;
        }

        // 입력 좌표를 배열 인덱스로 변환
        row--;
        col--;

        if (row < 0 || row >= msSize ||
            col < 0 || col >= msSize)
        {
            cout << "게임판 범위를 벗어났습니다." << endl;
            continue;
        }

        // 깃발 설치 또는 해제
        if (command == 'F')
        {
            if (opened[row][col])
            {
                cout << "이미 열린 칸입니다." << endl;
                continue;
            }

            if (flags[row][col])
            {
                flags[row][col] = false;
                cout << "깃발을 해제했습니다." << endl;
            }
            else
            {
                if (flagCount >= msMineCount)
                {
                    cout << "더 이상 깃발을 설치할 수 없습니다."
                        << endl;
                    continue;
                }

                flags[row][col] = true;
                cout << "깃발을 설치했습니다." << endl;
            }

            continue;
        }

        // 칸 열기
        if (opened[row][col])
        {
            cout << "이미 열린 칸입니다." << endl;
            continue;
        }

        if (flags[row][col])
        {
            cout << "깃발을 먼저 해제하세요." << endl;
            continue;
        }

        // 첫 번째 칸을 열 때 지뢰 배치
        if (firstOpen)
        {
            placeMines(mines, row, col);
            firstOpen = false;
        }

        openCount++;

        // 지뢰를 밟았다면 패배
        if (mines[row][col])
        {
            showMinesweeperBoard(mines, opened, flags, true);

            cout << "\n====================================" << endl;
            cout << "              GAME OVER!            " << endl;
            cout << "====================================" << endl;
            cout << "지뢰를 밟았습니다!" << endl;
            cout << "총 열기 횟수: " << openCount << endl;
            return;
        }

        // 안전한 칸 열기
        openSafeCells(mines, opened, flags, row, col);

        // 모든 안전한 칸을 열었다면 승리
        if (checkMinesweeperWin(mines, opened))
        {
            showMinesweeperBoard(mines, opened, flags, true);

            cout << "\n====================================" << endl;
            cout << "             GAME CLEAR!            " << endl;
            cout << "====================================" << endl;
            cout << "축하합니다! 모든 안전한 칸을 찾았습니다!" << endl;
            cout << "총 열기 횟수: " << openCount << endl;
            return;
        }
    }
}

// 지뢰찾기 메인 실행 함수
void playMinesweeper()
{
    string choice;

    showMinesweeperRules();

    while (true)
    {
        cout << "\n========== 난이도 선택 ==========" << endl;
        cout << "[1] 쉬움   (6×6, 지뢰 6개)" << endl;
        cout << "[2] 보통   (8×8, 지뢰 12개)" << endl;
        cout << "[3] 어려움 (10×10, 지뢰 20개)" << endl;
        cout << "[4] 게임 규칙 다시 보기" << endl;
        cout << "[0] 메인 메뉴로 돌아가기" << endl;
        cout << "선택: ";

        if (!(cin >> choice))
        {
            return;
        }

        if (choice == "1" ||
            choice == "2" ||
            choice == "3")
        {
            int difficulty = choice[0] - '0';

            setMinesweeperDifficulty(difficulty);

            // getline 사용을 위해 줄바꿈 제거
            cin.ignore(10000, '\n');

            startMinesweeperGame();
        }
        else if (choice == "4")
        {
            showMinesweeperRules();
        }
        else if (choice == "0")
        {
            cout << "메인 메뉴로 돌아갑니다." << endl;
            return;
        }
        else
        {
            cout << "0~4 사이에서 선택하세요." << endl;
        }
    }
}
