
#include <iostream>
#include <cstdlib>
#include <string>
#include <sstream>

#include "Pipes.h"

using namespace std;

// 게임판 크기
const int PIPE_SIZE = 5;

// 파이프 연결 방향
const int NORTH = 1; // 위
const int EAST = 2;  // 오른쪽
const int SOUTH = 4; // 아래
const int WEST = 8;  // 왼쪽

// 시작점과 도착점
const int START_ROW = 1;
const int START_COL = 0;

const int END_ROW = 3;
const int END_COL = 4;

// ==================================================
// 1. 게임 규칙 설명
// ==================================================
void showPipesRules()
{
    cout << "\n====================================" << endl;
    cout << "           PIPE CONNECT             " << endl;
    cout << "====================================" << endl;

    cout << "\n[게임 소개]" << endl;
    cout << "파이프를 회전시켜 물길을 연결하는 두뇌 퍼즐입니다." << endl;
    cout << "시작점부터 도착점까지 끊기지 않게 연결하세요!" << endl;

    cout << "\n[게임 규칙]" << endl;
    cout << "1. 게임판은 5×5 크기입니다." << endl;
    cout << "2. 각 칸에는 직선 또는 ㄱ자 파이프가 있습니다." << endl;
    cout << "3. 파이프를 시계 방향으로 90도씩 회전합니다." << endl;
    cout << "4. 연결된 파이프는 서로 입구와 출구가 맞아야 합니다." << endl;
    cout << "5. 왼쪽 시작점에서 오른쪽 도착점까지 연결하면 승리합니다." << endl;
    cout << "6. 게임을 시작할 때마다 새로운 경로가 생성됩니다." << endl;

    cout << "\n[파이프 모양]" << endl;
    cout << "| : 위 + 아래 연결" << endl;
    cout << "- : 왼쪽 + 오른쪽 연결" << endl;
    cout << "L : 위 + 오른쪽 연결" << endl;
    cout << "J : 위 + 왼쪽 연결" << endl;
    cout << "7 : 아래 + 왼쪽 연결" << endl;
    cout << "F : 아래 + 오른쪽 연결" << endl;

    cout << "\n[조작 방법]" << endl;
    cout << "R 행 열 : 파이프 90도 회전" << endl;
    cout << "C       : 현재 연결 상태 확인" << endl;
    cout << "0       : 게임 종료" << endl;

    cout << "\n[입력 예시]" << endl;
    cout << "R 2 3 -> 2행 3열 파이프 회전" << endl;
    cout << "C     -> 연결 상태 확인" << endl;

    cout << "\n[게임 목표]" << endl;
    cout << "최대한 적은 회전 횟수로 물길을 완성하세요!" << endl;

    cout << "\n====================================" << endl;
}

// ==================================================
// 2. 파이프를 시계 방향으로 90도 회전
// ==================================================
int rotatePipe(int pipe)
{
    int rotated = 0;

    if (pipe & NORTH)
    {
        rotated = rotated | EAST;
    }

    if (pipe & EAST)
    {
        rotated = rotated | SOUTH;
    }

    if (pipe & SOUTH)
    {
        rotated = rotated | WEST;
    }

    if (pipe & WEST)
    {
        rotated = rotated | NORTH;
    }

    return rotated;
}

// ==================================================
// 3. 파이프 방향을 문자로 변환
// ==================================================
char getPipeSymbol(int pipe)
{
    if (pipe == (NORTH | SOUTH))
        return '|';

    if (pipe == (EAST | WEST))
        return '-';

    if (pipe == (NORTH | EAST))
        return 'L';

    if (pipe == (NORTH | WEST))
        return 'J';

    if (pipe == (SOUTH | WEST))
        return '7';

    if (pipe == (SOUTH | EAST))
        return 'F';

    return '?';
}

// ==================================================
// 4. 무작위 정답 경로 생성
// ==================================================
void initializePipes(int board[PIPE_SIZE][PIPE_SIZE])
{
    // 기본 파이프 무작위 배치
    for (int i = 0; i < PIPE_SIZE; i++)
    {
        for (int j = 0; j < PIPE_SIZE; j++)
        {
            if (rand() % 2 == 0)
            {
                board[i][j] = NORTH | SOUTH;
            }
            else
            {
                board[i][j] = NORTH | EAST;
            }
        }
    }

    // 시작점과 도착점 사이의 이동 방향
    int directions[4] = {
        EAST, EAST, SOUTH, SOUTH
    };

    // 이동 방향 순서를 무작위로 섞기
    for (int i = 3; i > 0; i--)
    {
        int j = rand() % (i + 1);

        int temp = directions[i];
        directions[i] = directions[j];
        directions[j] = temp;
    }

    // 정답 경로 저장용 배열
    int path[PIPE_SIZE][PIPE_SIZE] = { 0 };

    int row = START_ROW;
    int col = START_COL;

    // 시작점은 왼쪽 외부에서 물이 들어옴
    path[row][col] = WEST;

    // 처음과 마지막 이동은 오른쪽으로 고정
    int moves[6];

    moves[0] = EAST;

    for (int i = 0; i < 4; i++)
    {
        moves[i + 1] = directions[i];
    }

    moves[5] = EAST;

    // 실제 정답 경로 생성
    for (int i = 0; i < 6; i++)
    {
        int direction = moves[i];

        int nextRow = row;
        int nextCol = col;
        int opposite = 0;

        if (direction == EAST)
        {
            nextCol++;
            opposite = WEST;
        }
        else if (direction == SOUTH)
        {
            nextRow++;
            opposite = NORTH;
        }

        // 현재 파이프의 출구 추가
        path[row][col] =
            path[row][col] | direction;

        // 다음 파이프의 입구 추가
        path[nextRow][nextCol] =
            path[nextRow][nextCol] | opposite;

        row = nextRow;
        col = nextCol;
    }

    // 도착점은 오른쪽 외부로 연결
    path[END_ROW][END_COL] =
        path[END_ROW][END_COL] | EAST;

    // 생성된 정답 경로를 게임판에 반영
    for (int i = 0; i < PIPE_SIZE; i++)
    {
        for (int j = 0; j < PIPE_SIZE; j++)
        {
            if (path[i][j] != 0)
            {
                board[i][j] = path[i][j];
            }
        }
    }

    // 모든 파이프를 무작위로 회전
    for (int i = 0; i < PIPE_SIZE; i++)
    {
        for (int j = 0; j < PIPE_SIZE; j++)
        {
            int turns = rand() % 4;

            for (int k = 0; k < turns; k++)
            {
                board[i][j] = rotatePipe(board[i][j]);
            }
        }
    }
}

// ==================================================
// 5. 현재 게임판 출력
// ==================================================
void showPipesBoard(
    int board[PIPE_SIZE][PIPE_SIZE],
    int moves)
{
    cout << "\n====================================" << endl;
    cout << "             PIPE CONNECT           " << endl;
    cout << "====================================" << endl;

    cout << "회전 횟수: " << moves << endl;

    cout << "\n       1   2   3   4   5" << endl;
    cout << "     ---------------------" << endl;

    for (int i = 0; i < PIPE_SIZE; i++)
    {
        cout << " " << i + 1 << " | ";

        for (int j = 0; j < PIPE_SIZE; j++)
        {
            cout << getPipeSymbol(board[i][j])
                << "   ";
        }

        cout << endl;
    }

    cout << "\n시작점: 2행 1열 (왼쪽 입구)" << endl;
    cout << "도착점: 4행 5열 (오른쪽 출구)" << endl;

    cout << "\n[명령]" << endl;
    cout << "R 행 열 : 파이프 회전" << endl;
    cout << "C : 연결 상태 확인" << endl;
    cout << "0 : 게임 종료" << endl;
}

// ==================================================
// 6. 정답 경로 탐색
// ==================================================
bool findPipePath(
    int board[PIPE_SIZE][PIPE_SIZE],
    bool visited[PIPE_SIZE][PIPE_SIZE],
    int row, int col)
{
    // 게임판 범위를 벗어났는지 확인
    if (row < 0 || row >= PIPE_SIZE ||
        col < 0 || col >= PIPE_SIZE)
    {
        return false;
    }

    // 이미 방문한 칸은 검사하지 않음
    if (visited[row][col])
    {
        return false;
    }

    visited[row][col] = true;

    // 도착점에 도달하고 오른쪽으로 연결되어 있으면 성공
    if (row == END_ROW && col == END_COL)
    {
        if (board[row][col] & EAST)
        {
            return true;
        }
    }

    // 상하좌우 이동량
    int dr[4] = { -1, 0, 1, 0 };
    int dc[4] = { 0, 1, 0, -1 };

    int directions[4] = {
        NORTH, EAST, SOUTH, WEST
    };

    int opposite[4] = {
        SOUTH, WEST, NORTH, EAST
    };

    for (int i = 0; i < 4; i++)
    {
        int nr = row + dr[i];
        int nc = col + dc[i];

        // 현재 파이프에 해당 방향 출구가 있는지 확인
        if (!(board[row][col] & directions[i]))
        {
            continue;
        }

        // 인접 칸이 게임판 안에 있는지 확인
        if (nr < 0 || nr >= PIPE_SIZE ||
            nc < 0 || nc >= PIPE_SIZE)
        {
            continue;
        }

        // 다음 파이프에 반대 방향 입구가 있는지 확인
        if (!(board[nr][nc] & opposite[i]))
        {
            continue;
        }

        // 연결된 다음 파이프 탐색
        if (findPipePath(board, visited, nr, nc))
        {
            return true;
        }
    }

    return false;
}

// ==================================================
// 7. 시작점과 도착점 연결 여부 검사
// ==================================================
bool checkPipesWin(int board[PIPE_SIZE][PIPE_SIZE])
{
    // 시작점에 왼쪽 입구가 있어야 함
    if (!(board[START_ROW][START_COL] & WEST))
    {
        return false;
    }

    bool visited[PIPE_SIZE][PIPE_SIZE] = { false };

    return findPipePath(
        board, visited, START_ROW, START_COL);
}

// ==================================================
// 8. 시작점부터 연결된 파이프 탐색
// ==================================================
void exploreConnectedPipes(
    int board[PIPE_SIZE][PIPE_SIZE],
    bool visited[PIPE_SIZE][PIPE_SIZE],
    int row, int col)
{
    if (visited[row][col])
    {
        return;
    }

    visited[row][col] = true;

    int dr[4] = { -1, 0, 1, 0 };
    int dc[4] = { 0, 1, 0, -1 };

    int directions[4] = {
        NORTH, EAST, SOUTH, WEST
    };

    int opposite[4] = {
        SOUTH, WEST, NORTH, EAST
    };

    for (int i = 0; i < 4; i++)
    {
        int nr = row + dr[i];
        int nc = col + dc[i];

        // 현재 파이프에 연결 방향이 있는지
        if (!(board[row][col] & directions[i]))
        {
            continue;
        }

        // 다음 칸 범위 검사
        if (nr < 0 || nr >= PIPE_SIZE ||
            nc < 0 || nc >= PIPE_SIZE)
        {
            continue;
        }

        // 다음 파이프에 반대 방향 입구가 있는지
        if (!(board[nr][nc] & opposite[i]))
        {
            continue;
        }

        exploreConnectedPipes(
            board, visited, nr, nc);
    }
}

// ==================================================
// 9. 현재 연결 상태 출력
// ==================================================
void showPipesConnection(
    int board[PIPE_SIZE][PIPE_SIZE])
{
    bool visited[PIPE_SIZE][PIPE_SIZE] = { false };

    // 시작점의 왼쪽 입구가 연결되어 있어야 탐색
    if (board[START_ROW][START_COL] & WEST)
    {
        exploreConnectedPipes(
            board, visited, START_ROW, START_COL);
    }

    int connectedCount = 0;

    cout << "\n====================================" << endl;
    cout << "              연결 상태             " << endl;
    cout << "====================================" << endl;

    cout << "시작점: 2행 1열" << endl;
    cout << "도착점: 4행 5열" << endl;

    cout << "\n연결된 위치:" << endl;

    for (int i = 0; i < PIPE_SIZE; i++)
    {
        for (int j = 0; j < PIPE_SIZE; j++)
        {
            if (visited[i][j])
            {
                connectedCount++;

                cout << "("
                    << i + 1 << ","
                    << j + 1 << ") ";
            }
        }
    }

    if (connectedCount == 0)
    {
        cout << "없음";
    }

    cout << "\n\n연결된 파이프 개수: "
        << connectedCount << "개" << endl;

    if (checkPipesWin(board))
    {
        cout << "\n도착점까지 연결되었습니다!" << endl;
    }
    else
    {
        cout << "\n아직 도착점까지 연결되지 않았습니다."
            << endl;
    }

    cout << "====================================" << endl;
}

// ==================================================
// 10. 파이프 퍼즐 한 판 실행
// ==================================================
void startPipesGame()
{
    int board[PIPE_SIZE][PIPE_SIZE];
    int moves = 0;

    initializePipes(board);

    // 시작부터 완성된 게임판이 나오지 않도록 처리
    if (checkPipesWin(board))
    {
        board[START_ROW][START_COL] =
            rotatePipe(board[START_ROW][START_COL]);
    }

    while (true)
    {
        showPipesBoard(board, moves);

        // 승리 여부 확인
        if (checkPipesWin(board))
        {
            cout << "\n====================================" << endl;
            cout << "             GAME CLEAR!            " << endl;
            cout << "====================================" << endl;

            cout << "축하합니다! 물길을 완성했습니다!" << endl;
            cout << "총 회전 횟수: " << moves << endl;

            return;
        }

        cout << "\n명령 입력 (R 행 열 / C / 0): ";

        string line;

        if (!getline(cin, line))
        {
            cout << "입력이 종료되어 게임을 마칩니다." << endl;
            return;
        }

        // 게임 중도 종료
        if (line == "0")
        {
            cout << "파이프 퍼즐을 종료합니다." << endl;
            return;
        }

        stringstream ss(line);
        char command;

        if (!(ss >> command))
        {
            cout << "명령을 입력해 주세요." << endl;
            continue;
        }

        // 소문자 입력도 허용
        if (command >= 'a' && command <= 'z')
        {
            command = command - 'a' + 'A';
        }

        // 연결 상태 확인
        if (command == 'C')
        {
            string extra;

            if (ss >> extra)
            {
                cout << "C만 입력해 주세요." << endl;
                continue;
            }

            showPipesConnection(board);
            continue;
        }

        // 회전 명령인지 확인
        if (command != 'R')
        {
            cout << "R, C 또는 0을 입력해 주세요." << endl;
            continue;
        }

        int row, col;
        string extra;

        // 좌표 입력 검사
        if (!(ss >> row >> col) || (ss >> extra))
        {
            cout << "입력 형식이 잘못되었습니다." << endl;
            cout << "예: R 2 3" << endl;
            continue;
        }

        // 사용자 좌표를 배열 인덱스로 변환
        row--;
        col--;

        // 좌표 범위 검사
        if (row < 0 || row >= PIPE_SIZE ||
            col < 0 || col >= PIPE_SIZE)
        {
            cout << "행과 열은 1~5 사이여야 합니다." << endl;
            continue;
        }

        // 선택한 파이프 회전
        board[row][col] = rotatePipe(board[row][col]);

        moves++;

        cout << "\n파이프를 시계 방향으로 90도 회전했습니다."
            << endl;
    }
}

// ==================================================
// 11. 파이프 퍼즐 메인 실행 함수
// ==================================================
void playPipes()
{
    string choice;

    showPipesRules();

    while (true)
    {
        cout << "\n========== PIPE CONNECT ==========" << endl;
        cout << "[1] 게임 시작 / 다시 플레이" << endl;
        cout << "[2] 게임 규칙 다시 보기" << endl;
        cout << "[0] 메인 메뉴로 돌아가기" << endl;

        cout << "선택: ";

        if (!(cin >> choice))
        {
            return;
        }

        if (choice == "1")
        {
            // cin 다음 getline을 위한 줄바꿈 제거
            cin.ignore(10000, '\n');

            startPipesGame();
        }
        else if (choice == "2")
        {
            showPipesRules();
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
