#define UNICODE
#define WIN32_LEAN_AND_MEAN
#define WINVER 0x0700
#define _WIN32_WINNT 0x0700
#include <windows.h>
#include <dcomp.h>
#include <d3d11.h>
#include <d2d1.h>
#include <d2d1helper.h>
#include <dwmapi.h>

#include <iostream>
#include <sstream>

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

#define DCHECK(expr) (Check(__FILE__, __LINE__, #expr, (expr)))

std::ostream& Check(const char* file_name, int line_number,
                    const char* expr_string, bool expr_value) {
  if (expr_value) {
    static std::stringstream null_stream;
    return null_stream;
  }
  std::cerr << "Assetion failed: " << expr_string << std::endl <<
      "File: " << file_name << std::endl <<
      "Line: " << line_number;
  return std::cerr;
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
    if (ptr_) {
      ptr_->Release();
      ptr_ = nullptr;
    }
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

namespace gfx {
class Brush final {
  private: ComPtr<ID2D1SolidColorBrush> brush_;

  public: Brush(ID2D1RenderTarget* render_target, D2D1::ColorF color);
  public: ~Brush() = default;

  public: operator ID2D1SolidColorBrush*() const { return brush_; }
};

Brush::Brush(ID2D1RenderTarget* render_target, D2D1::ColorF color) {
  COM_VERIFY(render_target->CreateSolidColorBrush(color, &brush_));
}

}  // namespace gfx

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

  private: RECT bounds_;
  private: HWND hwnd_;

  protected: Window();
  protected: ~Window();

  public: operator HWND() const { return hwnd_; }

  public: const RECT& bounds() const { return bounds_; }

  protected: virtual void DidCreate();
  protected: virtual void DidResize();

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

void Window::DidCreate() {
}

void Window::DidResize() {
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

void Window::Init() {
}

LRESULT Window::OnMessage(UINT message, WPARAM wParam, LPARAM lParam) {
  switch (message) {
    case WM_CREATE:
      ::GetClientRect(*this, &bounds_);
      DidCreate();
      return 1;
    case WM_DESTROY:
      ::PostQuitMessage(0);
      return TRUE;
    case WM_WINDOWPOSCHANGED: {
      auto const wp = reinterpret_cast<WINDOWPOS*>(lParam);
      if (wp->flags & SWP_NOSIZE)
        return 0;
      if (!::IsIconic(*this)) {
        ::GetClientRect(*this, &bounds_);
        DidResize();
      }
      return 0;
    }
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
  private: ComPtr<ID2D1Factory1> d2d_factory_;
  private: ComPtr<ID3D11Device> d3d11_device_;
  private: ComPtr<IDCompositionDevice> composition_device_;
  private: ComPtr<IDCompositionTarget> composition_target_;

  private: ComPtr<IDCompositionVisual> root_visual_;
  private: ComPtr<IDXGISwapChain1> root_swap_chain_;
  private: ComPtr<ID2D1DeviceContext> root_device_context_;

  private: ComPtr<IDCompositionVisual> status_visual_;
  private: ComPtr<IDXGISwapChain1> status_swap_chain_;
  private: ComPtr<ID2D1DeviceContext> status_device_context_;

  public: MyApp();
  public: virtual ~MyApp();

  private: ComPtr<ID2D1DeviceContext> CreateDeviceContext(
      IDXGISwapChain1* swap_chain, int width, int height);
  private: ComPtr<IDXGISwapChain1> CreateSwapChain(int width, int height);

  public: void Run();

  // Window
  private: virtual void DidCreate() override;
  private: virtual void DidResize() override;
  private: virtual LRESULT OnMessage(UINT message, WPARAM wParam,
                                     LPARAM lParam) override;
};

MyApp::MyApp() {
  // Create Direct 2D factory.
  COM_VERIFY(::D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED,
                                 &d2d_factory_));

  // Create Direct 3D device.
  D3D_FEATURE_LEVEL feature_levels[] = {
      D3D_FEATURE_LEVEL_11_1,
      D3D_FEATURE_LEVEL_11_0,
  };

  auto const d3d11_flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT |
                           D3D11_CREATE_DEVICE_SINGLETHREADED |
                           D3D11_CREATE_DEVICE_DEBUG;

  COM_VERIFY(::D3D11CreateDevice(
      nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
      d3d11_flags, nullptr, 0, D3D11_SDK_VERSION,
      &d3d11_device_, feature_levels, nullptr));

  ComPtr<IDXGIDevice> dxgi_device;
  COM_VERIFY(dxgi_device.QueryFrom(d3d11_device_));

  // Create Direct Composition device.
  COM_VERIFY(::DCompositionCreateDevice(dxgi_device,
      __uuidof(IDCompositionDevice), composition_device_.location()));
}

MyApp::~MyApp() {
}

ComPtr<ID2D1DeviceContext> MyApp::CreateDeviceContext(
      IDXGISwapChain1* swap_chain, int width, int height) {
  ComPtr<IDXGIDevice1> dxgi_device;
  COM_VERIFY(dxgi_device.QueryFrom(d3d11_device_));

  ComPtr<ID2D1Device> d2d_device;
  COM_VERIFY(d2d_factory_->CreateDevice(dxgi_device, &d2d_device));

  ComPtr<ID2D1DeviceContext> d2d_device_context;
  COM_VERIFY(d2d_device->CreateDeviceContext(
      D2D1_DEVICE_CONTEXT_OPTIONS_NONE, &d2d_device_context));


  ComPtr<IDXGISurface> dxgi_back_buffer;
  swap_chain->GetBuffer(0, IID_PPV_ARGS(&dxgi_back_buffer));

  float dpi_x, dpi_y;
  d2d_factory_->GetDesktopDpi(&dpi_x, &dpi_y);
  D2D1_BITMAP_PROPERTIES1 bitmapProperties = D2D1::BitmapProperties1(
      D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW,
      D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM,
                        D2D1_ALPHA_MODE_PREMULTIPLIED),
      dpi_x, dpi_y);

  ComPtr<ID2D1Bitmap1> d2d_back_buffer;
  COM_VERIFY(d2d_device_context->CreateBitmapFromDxgiSurface(
      dxgi_back_buffer, &bitmapProperties, &d2d_back_buffer));
  d2d_device_context->SetTarget(d2d_back_buffer);

  d2d_device_context->SetTextAntialiasMode(D2D1_TEXT_ANTIALIAS_MODE_CLEARTYPE);

  return d2d_device_context;
}

ComPtr<IDXGISwapChain1> MyApp::CreateSwapChain(int width, int height) {
    ComPtr<IDXGIDevice> dxgi_device;
    COM_VERIFY(dxgi_device.QueryFrom(d3d11_device_));

    ComPtr<IDXGIAdapter> dxgi_adapter;
    dxgi_device->GetAdapter(&dxgi_adapter);

    ComPtr<IDXGIFactory2> dxgi_factory;
    dxgi_adapter->GetParent(IID_PPV_ARGS(&dxgi_factory));

    DXGI_SWAP_CHAIN_DESC1 swap_chain_desc = {0};
    swap_chain_desc.AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED;
    swap_chain_desc.Width = width;
    swap_chain_desc.Height = height;
    swap_chain_desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    swap_chain_desc.SampleDesc.Count = 1; // don't use multi-sampling
    swap_chain_desc.SampleDesc.Quality = 0;
    swap_chain_desc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    swap_chain_desc.BufferCount = 2;  // use double buffering to enable flip
    swap_chain_desc.Scaling = DXGI_SCALING_STRETCH;
    swap_chain_desc.SwapEffect = DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL;
    swap_chain_desc.Flags = 0;

    ComPtr<IDXGISwapChain1> swap_chain;
    COM_VERIFY(dxgi_factory->CreateSwapChainForComposition(
        d3d11_device_, &swap_chain_desc, nullptr, &swap_chain));
    return swap_chain;
}

void MyApp::DidCreate() {
  //  Setup visual tree
  COM_VERIFY(composition_device_->CreateVisual(&root_visual_));
  COM_VERIFY(composition_device_->CreateVisual(&status_visual_));
  COM_VERIFY(root_visual_->AddVisual(status_visual_, true, nullptr));

#if 0
  COM_VERIFY(root_visual_->SetBitmapInterpolationMode(
      DCOMPOSITION_BITMAP_INTERPOLATION_MODE_LINEAR));
#endif
  COM_VERIFY(root_visual_->SetBorderMode(DCOMPOSITION_BORDER_MODE_SOFT));

  // Setup target
  COM_VERIFY(composition_device_->CreateTargetForHwnd(
      *this, true, &composition_target_));
  COM_VERIFY(composition_target_->SetRoot(root_visual_));

  DidResize();
}

void MyApp::DidResize() {
  auto const width = bounds().right - bounds().left;
  auto const height = bounds().bottom - bounds().top;

  auto const tab_height = 32.0f;
  auto const splitter_height = 5.0f;
  auto const pane_height = (height - splitter_height - tab_height) / 2;

  // Reset root visual
  root_swap_chain_.reset(CreateSwapChain(width, height));
  root_device_context_ = CreateDeviceContext(root_swap_chain_, width, height);

  COM_VERIFY(root_visual_->SetContent(root_swap_chain_));
  COM_VERIFY(root_visual_->SetOffsetX(0.0f));
  COM_VERIFY(root_visual_->SetOffsetY(0.0f));

  // Reset status visual
  auto const status_width = width - 100.0f;
  auto const status_height = 50.0f;
  status_swap_chain_.reset(CreateSwapChain(status_width, status_height));
  status_device_context_ = CreateDeviceContext(status_swap_chain_, status_width,
                                               status_height);
  COM_VERIFY(status_visual_->SetContent(status_swap_chain_));
  COM_VERIFY(status_visual_->SetOffsetX(20));
  COM_VERIFY(status_visual_->SetOffsetY(height / 2));

  {
    // Setup transform for status visual
    ComPtr<IDCompositionRotateTransform> rotate_transform;
    COM_VERIFY(composition_device_->CreateRotateTransform(&rotate_transform));
    COM_VERIFY(rotate_transform->SetCenterX(status_width / 2));
    COM_VERIFY(rotate_transform->SetCenterY(status_height / 2));
    COM_VERIFY(rotate_transform->SetAngle(-5));
    COM_VERIFY(status_visual_->SetTransform(rotate_transform));
  }

  // Paint status visual
  {
    status_device_context_->BeginDraw();
    status_device_context_->Clear(D2D1::ColorF(0, 0, 0, 0.5));
    COM_VERIFY(status_device_context_->EndDraw());

    DXGI_PRESENT_PARAMETERS present_params = {0};
    COM_VERIFY(status_swap_chain_->Present1(1, 0, &present_params));
  }

  // Paint root visual
  root_device_context_->BeginDraw();
  root_device_context_->Clear(D2D1::ColorF(0, 0, 0, 0));

  D2D1_RECT_F pane_bounds[2];
  pane_bounds[0].left = 0;
  pane_bounds[0].right = width;
  pane_bounds[0].top = tab_height;
  pane_bounds[0].bottom = pane_height;

  pane_bounds[1].left = 0;
  pane_bounds[1].right = width;
  pane_bounds[1].top = pane_bounds[0].bottom + splitter_height;
  pane_bounds[1].bottom = height;

  gfx::Brush white_brush(root_device_context_,
                          D2D1::ColorF(D2D1::ColorF::White, 0.3f));

  gfx::Brush green_brush(root_device_context_,
                         D2D1::ColorF(D2D1::ColorF::Green, 0.5f));

  for (auto i = 0; i < 2; ++i) {
    root_device_context_->FillRectangle(pane_bounds[i], white_brush);
    auto const pane_height = pane_bounds[i].bottom - pane_bounds[i].top;
    auto const pane_width = pane_bounds[i].right - pane_bounds[i].left;
    D2D1_ELLIPSE ellipse;
    ellipse.point = D2D1::Point2F(pane_bounds[i].left + pane_width / 2,
                                  pane_bounds[i].top + pane_height / 2);
    ellipse.radiusX = pane_width / 3;
    ellipse.radiusY = pane_height / 3;
    root_device_context_->FillEllipse(ellipse, green_brush);
  }

  COM_VERIFY(root_device_context_->EndDraw());

  DXGI_PRESENT_PARAMETERS present_params = {0};
  COM_VERIFY(root_swap_chain_->Present1(1, 0, &present_params));

  // Update composition
  composition_device_->Commit();
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
