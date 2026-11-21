
#define NOMINMAX

#include <iostream>
#include <windows.h>
#include <limits>
#include <cstdlib>
#include <ctime>

#include "NumberBaseball.h"
#include "Game2048.h"
#include "Minesweeper.h"
#include "Pipes.h"
#include "Shikaku.h"

using namespace std;

// 메인 메뉴 출력 함수
void showMenu()
{
    cout << "\n====================================" << endl;
    cout << "         TAEIN BRAIN ARCADE         " << endl;
    cout << "====================================" << endl;

    cout << "  1. 숫자야구" << endl;
    cout << "  2. 2048" << endl;
    cout << "  3. 지뢰찾기" << endl;
    cout << "  4. 파이프" << endl;
    cout << "  5. 시카쿠" << endl;
    cout << "  0. 프로그램 종료" << endl;

    cout << "====================================" << endl;
}

// 선택한 게임 실행 함수

void showGameMessage(int choice)
{
    switch (choice)
    {
    case 1:
        playNumberBaseball(); // 숫자야구 실행
        break;

    case 2:
        play2048(); // 2048 게임 실행
        break;

    case 3:
        playMinesweeper(); // 지뢰찾기 실행
        break;

    case 4:
        playPipes(); // 파이프 퍼즐
        break;

    case 5:
        playShikaku(); // 시카쿠 퍼즐
        break;
    }
}


int main()
{
    SetConsoleOutputCP(CP_UTF8); // 한글 출력 설정

    srand(static_cast<unsigned int>(time(0))); // 난수 초기화

    int choice = 0;

    while (true) // 종료할 때까지 메인 메뉴 반복
    {
        showMenu();

        cout << "게임을 선택하세요: ";

        // 숫자가 아닌 값을 입력했는지 검사
        if (!(cin >> choice))
        {
            if (cin.eof()) // 입력이 종료되었다면 프로그램 종료
            {
                break;
            }

            cout << "\n숫자만 입력해 주세요!" << endl;

            cin.clear(); // 입력 오류 상태 초기화
            cin.ignore(numeric_limits<streamsize>::max(), '\n');

            continue; // 메뉴 처음부터 다시 실행
        }

        if (choice == 0)
        {
            cout << "\n프로그램을 종료합니다." << endl;
            break;
        }
        else if (choice >= 1 && choice <= 5)
        {
            showGameMessage(choice); // 해당 게임 실행
        }
        else
        {
            cout << "\n0~5 사이의 숫자를 입력해 주세요!" << endl;
        }
    }

    return 0;
}
