#define UNICODE
#define WIN32_LEAN_AND_MEAN
#define WINVER 0x0700
#define _WIN32_WINNT 0x0700
#include <windows.h>
#include <dcomp.h>
#include <d3d11.h>
#include <d2d1.h>
#include <dwmapi.h>

#include <iostream>

#pragma comment(lib, "d2d1.lib")
#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dcomp.lib")
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "dwrite.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "user32.lib")

#ifndef HINST_THISCOMPONENT
EXTERN_C IMAGE_DOS_HEADER __ImageBase;
#define HINST_THISCOMPONENT ((HINSTANCE)&__ImageBase)
#endif

#define DVLOG(m) std::cerr
#define NOTREACHED() __debugbreak()

#define COM_VERIFY(expr) { \
  auto const macro_hr = (expr); \
  if (FAILED(macro_hr)) { \
    DVLOG(ERROR) << "hr=" << std::hex << macro_hr << " " <<  #expr; \
    NOTREACHED(); \
  } \
}

template<class T> class ComPtr {
  private: T* ptr_;
  public: explicit ComPtr(T* ptr = nullptr) : ptr_(ptr) {}
  public: explicit ComPtr(T& ptr) : ptr_(&ptr) {}
  public: ComPtr(const ComPtr& other) : ptr_(other.ptr_) {
    if (ptr_)
      ptr_->AddRef();
  }
  public: ComPtr(ComPtr&& other) : ptr_(other.ptr_) {
    other.ptr_ = nullptr;
  }
  public: ~ComPtr() {
    if (ptr_)
      ptr_->Release();
  }
  public: operator T*() const { return ptr_; }
  public: explicit operator bool() const { return ptr_; }
  public: T* operator->() const { return ptr_; }
  public: T** operator&() {
    DCHECK(!ptr_) << "Leak COM interface";
    return &ptr_;
  }
  public: bool operator!() const { return !ptr_; }

  public: bool operator==(const ComPtr& other) const {
    return ptr_ == other.ptr_;
  }

  public: bool operator==(T* other) const {
    return ptr_ == other;
  }

  public: bool operator!=(const ComPtr& other) const {
    return ptr_ != other.ptr_;
  }

  public: bool operator!=(T* other) const {
    return ptr_ != other;
  }

  public: ComPtr& operator=(const ComPtr& other) {
    ptr_ = other.ptr_;
    if (ptr_)
      ptr_->AddRef();
  }

  public: ComPtr& operator=(ComPtr&& other) {
    ptr_ = other.ptr_;
    other.ptr_ = nullptr;
    if (ptr_)
      ptr_->AddRef();
    return *this;
  }

  public: T* get() const { return ptr_; }

  public: void** location() {
    DCHECK(!ptr_) << "Leak COM interface";
    return reinterpret_cast<void**>(&ptr_);
  }

  public: IUnknown** locationUnknown() {
    DCHECK(!ptr_) << "Leak COM interface";
    return reinterpret_cast<IUnknown**>(&ptr_);
  }

  public: T* release() {
    DCHECK(ptr_) << "Give ownership for uninitialized object";
    auto const ret = ptr_;
    ptr_ = nullptr;
    return ret;
  }

  public: void reset(T* ptr) {
    if (ptr_)
      ptr_->Release();
    ptr_ = ptr;
    if (ptr_)
      ptr_->AddRef();
  }

  public: void reset() {
    if (ptr_)
      ptr_->Release();
    ptr_ = nullptr;
  }

  public: HRESULT QueryFrom(IUnknown* other) {
    return other->QueryInterface(__uuidof(T), location());
  }
};

class ComInitializer {
  public: ComInitializer() {
    COM_VERIFY(::CoInitialize(nullptr));
  }
  public: ~ComInitializer() {
    ::CoUninitialize();
  }
};

//////////////////////////////////////////////////////////////////////
//
// Window
//
class Window {
  protected: class Creator {
    public: Creator(Window* window);
    public: ~Creator();
  };
  friend class Creator;

  private: HWND hwnd_;

  protected: Window();
  protected: ~Window();

  public: operator HWND() const { return hwnd_; }

  protected: static LPWSTR GetWindowClass();
  private: static Window* GetWindowFromHwnd(HWND hwnd);
  protected: virtual LRESULT OnMessage(UINT message, WPARAM wParam,
                                       LPARAM lParam);
  private: void Init();
  public: void Run();
  private: static LRESULT CALLBACK WindowProc(HWND hwnd, UINT message,
                                              WPARAM wParam, LPARAM lParam);
};

//////////////////////////////////////////////////////////////////////
//
// Window::Creator
//
static Window* global_creating_window;

Window::Creator::Creator(Window* window) {
  global_creating_window = window;
}

Window::Creator::~Creator(){
  global_creating_window = nullptr;
}

//////////////////////////////////////////////////////////////////////
//
// Window
//
Window::Window() : hwnd_(nullptr) {
}

Window::~Window() {
}

LPWSTR Window::GetWindowClass() {
  static LPWSTR class_name;
  if (class_name)
    return class_name;
  WNDCLASSEX wcex = { sizeof(WNDCLASSEX) };
  wcex.style = CS_HREDRAW | CS_VREDRAW;
  wcex.lpfnWndProc = Window::WindowProc;
  wcex.cbClsExtra = 0;
  wcex.cbWndExtra = sizeof(LONG_PTR);
  wcex.hInstance = HINST_THISCOMPONENT;
  wcex.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW+1);;
  wcex.lpszMenuName = nullptr;
  wcex.hCursor = ::LoadCursor(nullptr, IDC_ARROW);
  wcex.lpszClassName = L"Window";
  class_name = MAKEINTATOM(::RegisterClassEx(&wcex));
  return class_name;
}

void Window::Init() {
}

LRESULT Window::OnMessage(UINT message, WPARAM wParam, LPARAM lParam) {
  switch (message) {
    case WM_CREATE:
      return 1;
    case WM_DESTROY:
      ::PostQuitMessage(0);
      return TRUE;
  }
  return ::DefWindowProc(hwnd_, message, wParam, lParam);
}

void Window::Run() {
  Init();
  MSG msg;
  while (::GetMessage(&msg, nullptr, 0, 0)) {
    ::TranslateMessage(&msg);
    ::DispatchMessage(&msg);
  }
}

Window* Window::GetWindowFromHwnd(HWND hwnd) {
  auto const window = reinterpret_cast<Window*>(
      ::GetWindowLongPtr(hwnd, GWLP_USERDATA));
  if (window)
    return window;
  ::SetWindowLongPtr(hwnd, GWLP_USERDATA,
                     reinterpret_cast<LONG_PTR>(global_creating_window));
  global_creating_window->hwnd_ = hwnd;
  return global_creating_window;
}

LRESULT Window::WindowProc(HWND hwnd, UINT message, WPARAM wParam,
                          LPARAM lParam) {
  auto const window = GetWindowFromHwnd(hwnd);
  return window->OnMessage(message, wParam, lParam);
}

//////////////////////////////////////////////////////////////////////
//
// MyApp
//
class MyApp : public Window {
  public: MyApp();
  public: virtual ~MyApp();

  public: void Run();

  // Window
  private: virtual LRESULT OnMessage(UINT message, WPARAM wParam,
                                     LPARAM lParam) override;
};

MyApp::MyApp() {
}

MyApp::~MyApp() {
}

void MyApp::Run() {
  auto const hdc = GetDC(nullptr);
  auto const dpiX = GetDeviceCaps(hdc, LOGPIXELSX);
  auto const dpiY = GetDeviceCaps(hdc, LOGPIXELSY);
  ::ReleaseDC(nullptr, hdc);

  Window::Creator creator(this);
  auto const hwnd = ::CreateWindow(
    GetWindowClass(),
    L"Window Title",
    WS_OVERLAPPEDWINDOW,
    CW_USEDEFAULT,
    CW_USEDEFAULT,
    static_cast<UINT>(ceil(640.f * dpiX / 96.f)),
    static_cast<UINT>(ceil(480.f * dpiY / 96.f)),
    nullptr,
    nullptr,
    HINST_THISCOMPONENT,
    nullptr);
  if (!hwnd)
    return;
  ::ShowWindow(hwnd, SW_SHOWNORMAL);
  Window::Run();
}

// Window
LRESULT MyApp::OnMessage(UINT message, WPARAM wParam, LPARAM lParam) {
  switch (message) {
    case WM_ACTIVATE: {
        MARGINS margins;
        margins.cxLeftWidth = 0;
        margins.cxRightWidth = 0;
        margins.cyBottomHeight = 0;
        margins.cyTopHeight = -1;
        COM_VERIFY(::DwmExtendFrameIntoClientArea(*this, &margins));
        break;
    }
    case WM_PAINT: {
      PAINTSTRUCT ps;
      auto const hdc = ::BeginPaint(*this, &ps);
      ::FillRect(hdc, &ps.rcPaint,
                 static_cast<HBRUSH>(::GetStockObject(BLACK_BRUSH)));
      ::EndPaint(*this, &ps);
      return 1;
    }
  }
  return Window::OnMessage(message, wParam, lParam);
}

//////////////////////////////////////////////////////////////////////
//
// WinMain
//
int WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
  ::AllocConsole();
  ComInitializer com_initializer;
  MyApp my_app;
  my_app.Run();
  return 0;
}
