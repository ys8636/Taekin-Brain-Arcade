#include "BlockPuzzle.h"
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <utility>
#include <algorithm>
#include <cstdlib>
#include <ctime>
#include <cctype>

using namespace std;

namespace {
    const int BOARD_SIZE = 10;

    struct Piece {
        string name;                      // 블록 이름
        vector<pair<int, int>> cells;     // (행 오프셋, 열 오프셋)
        bool used = false;                // 이미 놓았는지
    };

    struct Snapshot {
        vector<vector<int>> board;
        vector<Piece> tray;
        int score;
        int moves;
    };

    const vector<Piece> SHAPES = {
        {"한 칸", {{0,0}}},
        {"가로 2칸", {{0,0},{0,1}}},
        {"세로 2칸", {{0,0},{1,0}}},
        {"가로 3칸", {{0,0},{0,1},{0,2}}},
        {"세로 3칸", {{0,0},{1,0},{2,0}}},
        {"정사각형 2x2", {{0,0},{0,1},{1,0},{1,1}}},
        {"L자", {{0,0},{1,0},{1,1}}},
        {"역L자", {{0,1},{1,0},{1,1}}},
        {"가로 4칸", {{0,0},{0,1},{0,2},{0,3}}},
        {"세로 4칸", {{0,0},{1,0},{2,0},{3,0}}},
        {"T자", {{0,0},{0,1},{0,2},{1,1}}},
        {"지그재그", {{0,0},{0,1},{1,1},{1,2}}},
        {"역지그재그", {{0,1},{0,2},{1,0},{1,1}}},
        {"긴 L자", {{0,0},{1,0},{2,0},{2,1}}},
        {"직사각형 3x2", {{0,0},{0,1},{1,0},{1,1},{2,0},{2,1}}},
        {"가로 5칸", {{0,0},{0,1},{0,2},{0,3},{0,4}}},
        {"세로 5칸", {{0,0},{1,0},{2,0},{3,0},{4,0}}},
        {"십자", {{0,1},{1,0},{1,1},{1,2},{2,1}}},
        {"정사각형 3x3", {{0,0},{0,1},{0,2},{1,0},{1,1},{1,2},{2,0},{2,1},{2,2}}}
    };

    const int TARGETS[4] = {350, 800, 1500, 2600};
    const char* DIFFICULTIES[4] = {"쉬움", "보통", "어려움", "매우 어려움"};

    // 난이도에 맞는 블록 후보 선택
    vector<int> getPiecePool(int level) {
        if (level == 0) return {0,1,2,3,4,5,6,7};
        if (level == 1) return {1,2,3,4,5,6,7,8,9,10,11,12};
        if (level == 2) return {2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17};
        return {3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18};
    }

    bool inBoard(int row, int col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    // 블록의 모든 칸이 빈 곳에 들어가는지 확인
    bool canPlace(const vector<vector<int>>& board, const Piece& piece, int row, int col) {
        for (const auto& cell : piece.cells) {
            const int r = row + cell.first;
            const int c = col + cell.second;
            if (!inBoard(r, c) || board[r][c] != 0) return false;
        }
        return true;
    }

    bool hasPlace(const vector<vector<int>>& board, const Piece& piece) {
        for (int r = 0; r < BOARD_SIZE; r++) {
            for (int c = 0; c < BOARD_SIZE; c++) {
                if (canPlace(board, piece, r, c)) return true;
            }
        }
        return false;
    }

    // 블록을 올리고 채워진 가로/세로 줄을 동시에 삭제
    int placeAndClear(vector<vector<int>>& board, const Piece& piece, int row, int col, int& cleared) {
        for (const auto& cell : piece.cells) board[row + cell.first][col + cell.second] = 1;
        vector<int> fullRows, fullCols;
        for (int r = 0; r < BOARD_SIZE; r++) {
            bool full = true;
            for (int c = 0; c < BOARD_SIZE; c++) if (board[r][c] == 0) full = false;
            if (full) fullRows.push_back(r);
        }
        for (int c = 0; c < BOARD_SIZE; c++) {
            bool full = true;
            for (int r = 0; r < BOARD_SIZE; r++) if (board[r][c] == 0) full = false;
            if (full) fullCols.push_back(c);
        }
        cleared = static_cast<int>(fullRows.size() + fullCols.size());
        for (int r : fullRows) for (int c = 0; c < BOARD_SIZE; c++) board[r][c] = 0;
        for (int c : fullCols) for (int r = 0; r < BOARD_SIZE; r++) board[r][c] = 0;
        return static_cast<int>(piece.cells.size()) * 10 + cleared * 100 + max(0, cleared - 1) * 50;
    }

    // 블록 3개를 다시 제공. 놓을 수 있는 블록이 가능하면 1개 이상 포함
    void newTray(const vector<vector<int>>& board, int level, vector<Piece>& tray) {
        vector<int> pool = getPiecePool(level), playable;
        for (int id : pool) if (hasPlace(board, SHAPES[id])) playable.push_back(id);
        vector<int> ids;
        if (!playable.empty()) ids.push_back(playable[rand() % playable.size()]);
        while (ids.size() < 3) ids.push_back(pool[rand() % pool.size()]);
        for (int i = static_cast<int>(ids.size()) - 1; i > 0; --i) {
            const int j = rand() % (i + 1);
            swap(ids[i], ids[j]);
        }
        tray.clear();
        for (int id : ids) tray.push_back(SHAPES[id]);
    }

    void printBoard(const vector<vector<int>>& board) {
        cout << "\n       ";
        for (int c = 1; c <= BOARD_SIZE; c++) cout << (c < 10 ? " " : "") << c << ' ';
        cout << "\n";
        for (int r = 0; r < BOARD_SIZE; r++) {
            cout << (r + 1 < 10 ? " " : "") << r + 1 << "  |  ";
            for (int c = 0; c < BOARD_SIZE; c++) cout << (board[r][c] ? "[] " : " . ");
            cout << "\n";
        }
    }

    void printTray(const vector<Piece>& tray) {
        cout << "\n[남은 블록]  P A 1 1 : A 블록을 1행 1열부터 배치\n";
        for (int i = 0; i < static_cast<int>(tray.size()); i++) {
            const Piece& p = tray[i];
            cout << char('A' + i) << ") " << p.name << (p.used ? " [사용함]" : "") << "\n";
            if (p.used) continue;
            int height = 0, width = 0;
            for (const auto& cell : p.cells) {
                height = max(height, cell.first + 1);
                width = max(width, cell.second + 1);
            }
            for (int r = 0; r < height; r++) {
                cout << "   ";
                for (int c = 0; c < width; c++) {
                    bool filled = false;
                    for (const auto& cell : p.cells) if (cell.first == r && cell.second == c) filled = true;
                    cout << (filled ? "[]" : "  ");
                }
                cout << "\n";
            }
        }
    }

    bool hasAnyMove(const vector<vector<int>>& board, const vector<Piece>& tray) {
        for (const Piece& p : tray) if (!p.used && hasPlace(board, p)) return true;
        return false;
    }

    void showHint(const vector<vector<int>>& board, const vector<Piece>& tray) {
        int bestPoints = -1, bestIndex = -1, bestRow = -1, bestCol = -1;
        for (int i = 0; i < static_cast<int>(tray.size()); i++) {
            if (tray[i].used) continue;
            for (int r = 0; r < BOARD_SIZE; r++) for (int c = 0; c < BOARD_SIZE; c++) {
                if (!canPlace(board, tray[i], r, c)) continue;
                auto temp = board;
                int cleared = 0;
                const int points = placeAndClear(temp, tray[i], r, c, cleared);
                if (points > bestPoints) {bestPoints = points;bestIndex = i;bestRow = r;bestCol = c;}
            }
        }
        if (bestIndex < 0) cout << "배치 가능한 블록이 없어요.\n";
        else cout << "[힌트] " << char('A' + bestIndex) << " 블록을 " << bestRow+1 << "행 " << bestCol+1
                  << "열에 놓아보세요. 예상 +" << bestPoints << "점 (자동 배치 아님)\n";
    }

    bool allUsed(const vector<Piece>& tray) {
        for (const Piece& p : tray) if (!p.used) return false;
        return true;
    }

    void runGame(int level) {
        vector<vector<int>> board(BOARD_SIZE, vector<int>(BOARD_SIZE, 0));
        vector<Piece> tray;
        vector<Snapshot> undo;
        int score = 0, moves = 0;
        const int target = TARGETS[level];
        newTray(board, level, tray);
        cout << "\n[블록 퍼즐 - " << DIFFICULTIES[level] << "] 목표 " << target << "점\n";
        cout << "블록 3개를 10x10 칸에 놓으세요. 가로/세로 한 줄이 꽉 차면 사라집니다.\n";
        cout << "명령: P A 1 1 (배치) / H (힌트) / U (되돌리기) / 0 (메뉴)\n";
        while (true) {
            cout << "\n======================================================\n";
            cout << "현재 점수 " << score << " / 목표 " << target << " | 배치 횟수 " << moves << "\n";
            printBoard(board);
            printTray(tray);
            if (!hasAnyMove(board, tray)) {
                cout << "\n게임 오버! 놓을 수 있는 블록이 없습니다. U로 되돌릴 수 있어요.\n";
            }
            cout << "\n명령 입력: ";
            string line;
            if (!getline(cin >> ws, line)) return;
            istringstream input(line);
            string command;input >> command;
            if (command == "0") return;
            if (command == "H" || command == "h") {showHint(board, tray);continue;}
            if (command == "U" || command == "u") {
                if (undo.empty()) {cout << "되돌릴 기록이 없습니다.\n";continue;}
                Snapshot old = undo.back();undo.pop_back();
                board = old.board;tray = old.tray;score = old.score;moves = old.moves;
                cout << "이전 배치를 되돌렸어요.\n";continue;
            }
            if (command != "P" && command != "p") {cout << "알 수 없는 명령입니다.\n";continue;}
            char label;int row,col;
            string extra;
            if (!(input >> label >> row >> col) || (input >> extra)) {
                cout << "입력 형식: P A 1 1 (블록, 행, 열)\n";continue;
            }
            label = static_cast<char>(toupper(static_cast<unsigned char>(label)));
            int index = label - 'A';
            if (index < 0 || index >= static_cast<int>(tray.size()) || tray[index].used) {
                cout << "선택할 수 없는 블록입니다. A, B, C 중 남은 것을 골라주세요.\n";continue;
            }
            if (!canPlace(board, tray[index], row-1, col-1)) {
                cout << "그 위치는 배치할 수 없습니다. 빈칸과 테두리를 확인해 주세요.\n";continue;
            }
            undo.push_back({board, tray, score, moves});
            int cleared = 0;
            int gained = placeAndClear(board, tray[index], row-1, col-1, cleared);
            score += gained; moves++;
            tray[index].used = true;
            cout << "배치 성공! +" << gained << "점";
            if (cleared) cout << " / " << cleared << "줄 제거!";
            cout << "\n";
            if (score >= target) {
                cout << "\n*** 목표 달성! " << score << "점으로 승리! ***\n";
                cout << "Enter를 누르면 난이도 메뉴로 돌아갑니다.\n";
                string dummy;getline(cin, dummy);return;
            }
            if (allUsed(tray)) newTray(board, level, tray);
        }
    }
}

void playBlockPuzzle() {
    while (true) {
        cout << "\n========== BLOCK PUZZLE / 블록 퍼즐 ==========\n";
        cout << "[1] 쉬움 (350점)\n[2] 보통 (800점)\n[3] 어려움 (1500점)\n[4] 매우 어려움 (2600점)\n[0] 메인 메뉴\n";
        cout << "선택: ";
        string text;
        if (!getline(cin >> ws, text)) return;
        if (text == "0") return;
        if (text != "1" && text != "2" && text != "3" && text != "4") {
            cout << "0~4 중에서 선택해 주세요.\n";continue;
        }
        runGame(text[0] - '1');
    }
}

// 아래 옵션을 켜면 이 파일만 별도 콘솔 프로그램으로 시험할 수 있습니다.
#ifdef BLOCK_PUZZLE_STANDALONE
int main() {
    srand(static_cast<unsigned int>(time(nullptr)));
    playBlockPuzzle();
    return 0;
}
#endif
